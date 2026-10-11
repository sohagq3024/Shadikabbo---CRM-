type CrmData = Record<string, any>;

const CLEANUP_KEY = 'importedDemoCleanup';

function hasReference(value: unknown, ids: Set<string>): boolean {
  if (typeof value === 'string') return ids.has(value);
  if (Array.isArray(value)) return value.some(item => hasReference(item, ids));
  if (value && typeof value === 'object') return Object.values(value).some(item => hasReference(item, ids));
  return false;
}

function isImportedSampleClient(row: any): boolean {
  // Exact imported fixture pattern, not a substring search inside base64.
  if (!/@example\.com$/i.test(String(row.email || ''))) return false;
  const pdf = String(row.pdf?.dataUrl || '');
  if (!pdf.startsWith('data:application/pdf;base64,')) return false;
  const bytes = Buffer.from(pdf.split(',')[1] || '', 'base64');
  return bytes.length < 32 && bytes.toString('ascii').startsWith('%PDF-');
}

export function cleanupImportedDemos(data: CrmData): number {
  if (data._migrations?.[CLEANUP_KEY]) return 0;
  const users = Array.isArray(data.users) ? data.users : [];
  if (!users.some((user: any) => user.role === 'Super Admin' && user.status !== 'suspended')) {
    throw new Error('Demo cleanup requires an active Super Admin to preserve.');
  }
  const demoUsers = users.filter((user: any) =>
    user.role !== 'Super Admin' &&
    /^usr_(?:mk|cro)_\d+$/.test(String(user.id)) &&
    /^01[78]0000000\d$/.test(String(user.phone)),
  );
  const userIds = new Set<string>(demoUsers.map((user: any) => user.id));
  const demoTraffic = (data.traffics || []).filter(isImportedSampleClient);
  const trafficIds = new Set<string>(demoTraffic.map((row: any) => row.id));
  let removed = 0;
  const remove = (collection: string, predicate: (row: any) => boolean) => {
    if (!Array.isArray(data[collection])) return;
    const before = data[collection].length;
    data[collection] = data[collection].filter((row: any) => !predicate(row));
    removed += before - data[collection].length;
  };
  remove('users', row => userIds.has(row.id));
  remove('sessions', row => userIds.has(row.userId));
  remove('attendance', row => hasReference(row, userIds));
  remove('dailyReports', row => hasReference(row, userIds));
  remove('traffics', row => trafficIds.has(row.id));
  remove('payments', row => hasReference(row, trafficIds));
  remove('paymentRequests', row => hasReference(row, trafficIds));
  data._migrations = { ...(data._migrations || {}), [CLEANUP_KEY]: true };
  // Do not reset counters, change real records, or purge unmarked leads.
  return removed + 1;
}
