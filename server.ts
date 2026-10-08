process.env.DISABLE_HMR = 'true';

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  DEFAULT_FIELD_SEEDINGS,
  DEFAULT_AGENCY_SETTINGS,
  CrmFieldSeedings,
  AgencySettings,
} from './src/constants/defaultFieldSeedings';
import { setupAttendanceRoutes } from './src/server/attendanceRoutes';
import { setupDailyReportRoutes } from './src/server/dailyReportRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Ensure data folder exists
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'crm_store.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_shadikabbo_salt_2026').digest('hex');
}

// Initial DB initialization
interface SystemUser {
  id: string;
  phone: string; // Official number - required for login
  name: string;
  role: 'Super Admin' | 'CRO' | 'MK';
  passwordHash: string;
  gender?: 'Male' | 'Female' | 'Other';
  joiningDate?: string;
  branch?: string; // 'Uttara', 'Dhanmondi', etc.
  personalPhone?: string;
  presentLocation?: string;
  currentLocation?: string;
  email?: string;
  profilePicture?: string;
  status?: 'active' | 'suspended';
  createdAt?: number;
}

interface DatabaseSchema {
  users: SystemUser[];
  traffics: any[];
  leads: any[];
  paymentRequests: any[];
  payments: any[];
  sessions: { token: string; userId: string; createdAt: number }[];
  nextSerial: number;
  nextLeadSerial: number;
  customFields?: CrmFieldSeedings;
  agencySettings?: AgencySettings;
  matchmakingLevels?: string[];
  [key: string]: any;
}

function computeLeadCompleteness(data: any): { percentage: number; stars: number } {
  let score = 0;
  // Part 1: Mandatory for Lead (Name + Phone + Category = 20%) -> Guarantees 20% & 1 Star
  if (data.name && String(data.name).trim()) score += 8;
  if (data.phone && String(data.phone).trim()) score += 6;
  if (data.category && String(data.category).trim()) score += 6;

  // Part 2: Specific Optional Fields (each adds 8% -> 10 options * 8% = 80%)
  if (data.profession && String(data.profession).trim()) score += 8;
  if (data.dateOfBirth && String(data.dateOfBirth).trim()) score += 8;
  if (data.maritalStatus && String(data.maritalStatus).trim()) score += 8;
  if (data.gender && String(data.gender).trim()) score += 8;
  if (data.height && String(data.height).trim()) score += 8;
  if (data.religion && String(data.religion).trim()) score += 8;
  if (data.qualification && String(data.qualification).trim()) score += 8;
  if (
    (data.presentCity && String(data.presentCity).trim()) ||
    (data.permanentCity && String(data.permanentCity).trim())
  ) {
    score += 8;
  }
  if (Array.isArray(data.images) && data.images.length > 0) score += 8;
  if (data.pdf && (data.pdf.dataUrl || data.pdf.name)) score += 8;

  const percentage = Math.min(100, Math.max(0, score));
  // 1st part filled = 20% -> 1 Star (★☆☆☆☆)
  // 20-39% = 1 Star, 40-59% = 2 Stars, 60-79% = 3 Stars, 80-99% = 4 Stars, 100% = 5 Stars
  const stars = percentage < 20 ? 0 : Math.min(5, Math.floor(percentage / 20));
  return { percentage, stars };
}

function loadDB(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [
        {
          id: 'usr_super_admin',
          phone: '01723867646',
          name: 'Sohag',
          role: 'Super Admin',
          passwordHash: hashPassword('sohag12345'),
        },
        {
          id: 'usr_mk_1',
          phone: '01700000001',
          name: 'MK - Tanvir Ahmed',
          role: 'MK',
          passwordHash: hashPassword('mk12345'),
        },
        {
          id: 'usr_mk_2',
          phone: '01700000002',
          name: 'MK - Rashedul Islam',
          role: 'MK',
          passwordHash: hashPassword('mk12345'),
        },
        {
          id: 'usr_cro_1',
          phone: '01800000001',
          name: 'CRO - Farhana Khan',
          role: 'CRO',
          passwordHash: hashPassword('cro12345'),
        },
        {
          id: 'usr_cro_2',
          phone: '01800000002',
          name: 'CRO - Mahmud Hasan',
          role: 'CRO',
          passwordHash: hashPassword('cro12345'),
        },
      ],
      traffics: [],
      leads: [],
      paymentRequests: [],
      payments: [],
      sessions: [],
      nextSerial: 1,
      nextLeadSerial: 1,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.traffics) parsed.traffics = [];
    if (!parsed.leads) parsed.leads = [];
    if (!parsed.paymentRequests) parsed.paymentRequests = [];
    if (!parsed.payments) parsed.payments = [];
    let didAutoSync = false;
    if (!parsed.sessions) parsed.sessions = [];
    if (!parsed.nextSerial) parsed.nextSerial = (parsed.traffics.length || 0) + 1;
    if (!parsed.nextLeadSerial) parsed.nextLeadSerial = (parsed.leads.length || 0) + 1;
    if (!parsed.customFields) {
      parsed.customFields = { ...DEFAULT_FIELD_SEEDINGS };
      didAutoSync = true;
    }
    if (parsed.customFields && !parsed.customFields.leadCategories) {
      parsed.customFields.leadCategories = [...DEFAULT_FIELD_SEEDINGS.leadCategories];
      didAutoSync = true;
    }
    // Auto-migrate any existing leads without category
    (parsed.leads || []).forEach((l: any) => {
      if (!l.category) {
        l.category = 'FB Message';
        didAutoSync = true;
      }
    });
    if (!parsed.agencySettings) {
      parsed.agencySettings = { ...DEFAULT_AGENCY_SETTINGS };
      didAutoSync = true;
    }

    // Auto-sync any existing traffic with pending paid amounts into paymentRequests
    (parsed.traffics || []).forEach((t: any) => {
      if (t.status !== 'trash' && Number(t.paidAmount) > 0 && t.paymentStatus !== 'accepted') {
        const hasReq = parsed.paymentRequests.some(
          (pr: any) => pr.trafficId === t.id && (pr.status === 'pending' || pr.status === 'accepted')
        );
        if (!hasReq) {
          const prId = `PR-${String(parsed.paymentRequests.length + 1).padStart(4, '0')}`;
          parsed.paymentRequests.push({
            id: prId,
            trafficId: t.id,
            trafficName: t.name,
            phone: t.phone,
            date: t.createdAt || '2026-10-03',
            formattedDate: t.createdAt ? `${t.createdAt} 10:00` : '2026-10-03 10:00',
            timestamp: t.createdTimestamp || Date.now(),
            paidAmount: Number(t.paidAmount) || 0,
            dueAmount: Number(t.dueAmount) || 0,
            afterMarriageFee: Number(t.afterMarriageFee) || 0,
            package: t.package || 'Standard',
            paymentMethod: t.paymentMethod || 'bKash',
            assignedBy: t.assignBy || t.createdBy || 'Sohag',
            createdBy: t.createdBy || 'Sohag',
            creatorRole: t.creatorRole || 'Super Admin',
            creatorPhone: t.phone || '',
            role: t.creatorRole || 'Super Admin',
            status: 'pending',
            images: t.images || [],
            gender: t.gender || '',
          });
          t.paymentStatus = 'pending';
          didAutoSync = true;
        }
      }
    });

    if (didAutoSync) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }

    return parsed;
  } catch (err) {
    console.error('Error reading db file, resetting:', err);
    return {
      users: [],
      traffics: [],
      leads: [],
      paymentRequests: [],
      payments: [],
      sessions: [],
      nextSerial: 1,
      nextLeadSerial: 1,
    };
  }
}

function saveDB(data: DatabaseSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Session validation middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing session token' });
  }

  const token = authHeader.split(' ')[1];
  const db = loadDB();
  const session = db.sessions.find(s => s.token === token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Please contact Super Admin.' });
  }

  (req as any).user = user;
  next();
}

function sanitizeUser(u: SystemUser) {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    role: u.role,
    gender: u.gender || 'Male',
    joiningDate: u.joiningDate || '2024-01-15',
    branch: u.branch || (u.role === 'CRO' ? 'Dhanmondi' : 'Uttara'),
    personalPhone: u.personalPhone || '',
    presentLocation: u.presentLocation || '',
    currentLocation: u.currentLocation || '',
    email: u.email || '',
    profilePicture: u.profilePicture || '',
    status: u.status || 'active',
    createdAt: u.createdAt || 0,
  };
}

// --- AUTHENTICATION API ---
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Official phone number and password are required' });
  }

  const db = loadDB();
  const cleanPhone = String(phone).trim();
  const user = db.users.find(u => u.phone === cleanPhone);

  if (!user) {
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Please contact Super Admin.' });
  }

  const hashed = hashPassword(password);
  if (user.passwordHash !== hashed) {
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: Date.now(),
  });
  saveDB(db);

  return res.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({
    user: sanitizeUser(user),
  });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  const db = loadDB();
  db.sessions = db.sessions.filter(s => s.token !== token);
  saveDB(db);
  res.json({ success: true });
});

// --- USERS / ROLES API ---
app.get('/api/users', authMiddleware, (req, res) => {
  const db = loadDB();
  const role = req.query.role as string;
  let list = db.users.map(u => ({ id: u.id, phone: u.phone, name: u.name, role: u.role }));
  if (role) {
    list = list.filter(u => u.role === role);
  }
  res.json(list);
});

// --- ACCOUNTS MANAGEMENT API (Requirement 6) ---
// 1. Get Accounts (Super Admin sees all, CRO/MK see only their own profile)
app.get('/api/accounts', authMiddleware, (req, res) => {
  const db = loadDB();
  const actor = (req as any).user;

  if (actor.role === 'Super Admin') {
    const list = (db.users || []).map(sanitizeUser);
    return res.json(list);
  }

  // CRO & MK only see their own account
  const ownUser = (db.users || []).find(u => u.id === actor.id);
  res.json(ownUser ? [sanitizeUser(ownUser)] : []);
});

// 2. Add Account (Super Admin only)
app.post('/api/accounts', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Permission denied: Only Super Admin can create accounts.' });
  }

  const {
    name,
    joiningDate,
    gender,
    role,
    branch,
    phone, // Official number - required for login
    personalPhone,
    presentLocation,
    currentLocation,
    email,
    profilePicture,
    password, // Required for login
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Employee name is required.' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Official phone number is required.' });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ error: 'Password is required for login.' });
  }
  if (!role || !['CRO', 'MK', 'Super Admin'].includes(role)) {
    return res.status(400).json({ error: 'Valid role (CRO or MK) is required.' });
  }

  const cleanPhone = String(phone).trim();
  const db = loadDB();

  // Check unique official number
  const existing = (db.users || []).find(u => u.phone === cleanPhone);
  if (existing) {
    return res.status(400).json({ error: 'Official phone number is already registered for another employee.' });
  }

  const rolePrefix = role === 'CRO' ? 'cro' : role === 'MK' ? 'mk' : 'admin';
  const newId = `usr_${rolePrefix}_${Date.now()}`;

  const newUser: SystemUser = {
    id: newId,
    phone: cleanPhone,
    name: name.trim(),
    role,
    passwordHash: hashPassword(password.trim()),
    gender: gender || 'Male',
    joiningDate: joiningDate || new Date().toISOString().split('T')[0],
    branch: branch || 'Uttara',
    personalPhone: personalPhone?.trim() || '',
    presentLocation: presentLocation?.trim() || '',
    currentLocation: currentLocation?.trim() || '',
    email: email?.trim() || '',
    profilePicture: profilePicture || '',
    status: 'active',
    createdAt: Date.now(),
  };

  if (!db.users) db.users = [];
  db.users.push(newUser);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: `Account created successfully for ${newUser.name}`,
    user: sanitizeUser(newUser),
  });
});

// 3. Update Account
// Super Admin can edit all; CRO/MK can edit only their own basic info (WITHOUT official phone and password)
app.put('/api/accounts/:id', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  const { id } = req.params;
  const db = loadDB();

  const userIndex = (db.users || []).findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const target = db.users[userIndex];

  if (actor.role === 'Super Admin') {
    // Super Admin can update everything
    const {
      name,
      joiningDate,
      gender,
      role,
      branch,
      phone,
      personalPhone,
      presentLocation,
      currentLocation,
      email,
      profilePicture,
      password,
      status,
    } = req.body;

    if (phone && String(phone).trim() !== target.phone) {
      const cleanPhone = String(phone).trim();
      const conflict = db.users.find(u => u.phone === cleanPhone && u.id !== id);
      if (conflict) {
        return res.status(400).json({ error: 'Official phone number is already in use by another account.' });
      }
      target.phone = cleanPhone;
    }

    if (name) target.name = name.trim();
    if (role && ['CRO', 'MK', 'Super Admin'].includes(role)) target.role = role;
    if (branch) target.branch = branch;
    if (gender) target.gender = gender;
    if (joiningDate) target.joiningDate = joiningDate;
    if (personalPhone !== undefined) target.personalPhone = personalPhone;
    if (presentLocation !== undefined) target.presentLocation = presentLocation;
    if (currentLocation !== undefined) target.currentLocation = currentLocation;
    if (email !== undefined) target.email = email;
    if (profilePicture !== undefined) target.profilePicture = profilePicture;
    if (status && ['active', 'suspended'].includes(status)) target.status = status;
    if (password && String(password).trim()) {
      target.passwordHash = hashPassword(String(password).trim());
    }

    db.users[userIndex] = target;
    saveDB(db);

    return res.json({
      success: true,
      message: 'Account updated successfully',
      user: sanitizeUser(target),
    });
  }

  // CRO / MK updating their own account
  if (actor.id !== id) {
    return res.status(403).json({ error: 'Permission denied: You can only update your own profile.' });
  }

  // Notice: Official phone and password and role and status and branch are strictly locked for CRO/MK!
  const {
    name,
    gender,
    personalPhone,
    presentLocation,
    currentLocation,
    email,
    profilePicture,
  } = req.body;

  if (name) target.name = name.trim();
  if (gender) target.gender = gender;
  if (personalPhone !== undefined) target.personalPhone = personalPhone;
  if (presentLocation !== undefined) target.presentLocation = presentLocation;
  if (currentLocation !== undefined) target.currentLocation = currentLocation;
  if (email !== undefined) target.email = email;
  if (profilePicture !== undefined) target.profilePicture = profilePicture;

  db.users[userIndex] = target;
  saveDB(db);

  return res.json({
    success: true,
    message: 'Profile information updated successfully',
    user: sanitizeUser(target),
  });
});

// 4. Suspend / Active Account (Super Admin only)
app.put('/api/accounts/:id/status', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Permission denied: Only Super Admin can change account status.' });
  }

  const { id } = req.params;
  const db = loadDB();

  if (id === 'usr_super_admin') {
    return res.status(400).json({ error: 'The Primary Super Admin account cannot be suspended.' });
  }

  const user = (db.users || []).find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const nextStatus: 'active' | 'suspended' = user.status === 'suspended' ? 'active' : 'suspended';
  user.status = nextStatus;

  saveDB(db);

  res.json({
    success: true,
    status: nextStatus,
    message: `Account for ${user.name} is now ${nextStatus === 'active' ? 'Active' : 'Suspended'}.`,
    user: sanitizeUser(user),
  });
});

// 5. Delete Account (Super Admin only)
app.delete('/api/accounts/:id', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Permission denied: Only Super Admin can delete accounts.' });
  }

  const { id } = req.params;
  const db = loadDB();

  if (id === 'usr_super_admin' || id === actor.id) {
    return res.status(400).json({ error: 'Cannot delete the Super Admin account.' });
  }

  const index = (db.users || []).findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const deleted = db.users.splice(index, 1)[0];
  saveDB(db);

  res.json({
    success: true,
    message: `Account for ${deleted.name} deleted successfully.`,
  });
});

// Helper to ensure lead has initialized activityLog
function ensureLeadActivityLog(lead: any): any[] {
  if (lead.activityLog && Array.isArray(lead.activityLog)) {
    return lead.activityLog;
  }

  const logs: any[] = [
    {
      id: `act_${lead.id}_created`,
      leadId: lead.id,
      type: 'created',
      previousStatus: null,
      newStatus: lead.status || 'WP Connect',
      timestamp: lead.createdTimestamp || Date.now() - 86400000,
      formattedDate: lead.createdAt ? `${lead.createdAt} 10:00` : 'Initial Registration',
      user: {
        id: 'usr_super_admin',
        name: lead.createdBy || 'Sohag',
        role: lead.creatorRole || 'Super Admin',
      },
      comment: 'Lead candidate profile initially registered in CRM system',
    },
  ];

  if (lead.status === 'trash') {
    logs.unshift({
      id: `act_${lead.id}_trash`,
      leadId: lead.id,
      type: 'status_change',
      previousStatus: 'active',
      newStatus: 'trash',
      timestamp: Date.now() - 3600000,
      formattedDate: 'Recent',
      user: {
        id: 'usr_super_admin',
        name: 'Sohag',
        role: 'Super Admin',
      },
      comment: 'Lead moved to Trash Bin',
    });
  } else if (lead.status === 'converted') {
    logs.unshift({
      id: `act_${lead.id}_converted`,
      leadId: lead.id,
      type: 'status_change',
      previousStatus: 'active',
      newStatus: 'converted',
      timestamp: Date.now() - 1800000,
      formattedDate: 'Recent',
      user: {
        id: 'usr_super_admin',
        name: 'Sohag',
        role: 'Super Admin',
      },
      comment: `Transferred to active Traffic candidate (${lead.convertedToTrafficId || 'SK Candidate'})`,
    });
  }

  lead.activityLog = logs;
  return logs;
}

// Helper to ensure traffic has initialized activityLog
function ensureTrafficActivityLog(traffic: any): any[] {
  if (traffic.activityLog && Array.isArray(traffic.activityLog)) {
    return traffic.activityLog;
  }

  const logs: any[] = [
    {
      id: `act_${traffic.id}_created`,
      leadId: traffic.id,
      type: 'created',
      previousStatus: null,
      newStatus: traffic.status || 'WP Connect',
      timestamp: traffic.createdTimestamp || Date.now() - 86400000,
      formattedDate: traffic.createdAt ? `${traffic.createdAt} 10:00` : 'Initial Registration',
      user: {
        id: 'usr_super_admin',
        name: traffic.createdBy || 'Sohag',
        role: traffic.creatorRole || 'Super Admin',
      },
      comment: traffic.convertedFromLeadId
        ? `Candidate converted from Lead (${traffic.convertedFromLeadId})`
        : 'Traffic candidate profile registered in CRM system',
    },
  ];

  if (traffic.status === 'trash') {
    logs.unshift({
      id: `act_${traffic.id}_trash`,
      leadId: traffic.id,
      type: 'status_change',
      previousStatus: 'WP Connect',
      newStatus: 'trash',
      timestamp: Date.now() - 3600000,
      formattedDate: 'Recent',
      user: {
        id: 'usr_super_admin',
        name: 'Sohag',
        role: 'Super Admin',
      },
      comment: 'Candidate moved to Trash Bin',
    });
  }

  traffic.activityLog = logs;
  return logs;
}

// --- LEADS API ---
// 1. Get all active leads
// Super Admin sees all; CRO and MK only see leads created by themselves
app.get('/api/leads', authMiddleware, (req, res) => {
  const db = loadDB();
  const actor = (req as any).user;
  let activeLeads = (db.leads || [])
    .filter(l => l.status !== 'trash' && l.status !== 'converted');

  if (actor.role === 'CRO' || actor.role === 'MK') {
    activeLeads = activeLeads.filter(l => {
      if (l.creatorId) return l.creatorId === actor.id;
      return l.createdBy === actor.name;
    });
  }

  const result = activeLeads
    .sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0))
    .map(l => {
      const { percentage, stars } = computeLeadCompleteness(l);
      const activityLog = ensureLeadActivityLog(l);
      return {
        ...l,
        completeness: percentage,
        stars,
        createdBy: l.createdBy || 'Sohag',
        creatorRole: l.creatorRole || 'Super Admin',
        clientCategory: l.clientCategory || 'Normal',
        activityLog,
      };
    });
  res.json(result);
});

// 1.1 Get specific lead with activities
app.get('/api/leads/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const actor = (req as any).user;
  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  // Access check for CRO and MK: cannot view other people's leads
  if (actor.role === 'CRO' || actor.role === 'MK') {
    const isOwner = lead.creatorId === actor.id || lead.createdBy === actor.name;
    if (!isOwner) {
      return res.status(403).json({ error: 'Permission denied: You can only view your own leads.' });
    }
  }

  const { percentage, stars } = computeLeadCompleteness(lead);
  lead.activityLog = ensureLeadActivityLog(lead);
  res.json({
    ...lead,
    completeness: percentage,
    stars,
  });
});

// 1.2 Get activity log for a specific lead
app.get('/api/leads/:id/activities', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  const activities = ensureLeadActivityLog(lead);
  res.json({ activities, currentStatus: lead.status || 'active' });
});

// 1.3 Update lead status and record status transition in activity log
app.put('/api/leads/:id/status', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status: newStatus, comment } = req.body;
  if (!newStatus) {
    return res.status(400).json({ error: 'New status is required' });
  }

  const db = loadDB();
  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const previousStatus = lead.status || 'active';
  lead.status = newStatus;

  const actor = (req as any).user;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const activityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: lead.id,
    type: 'status_change',
    previousStatus,
    newStatus,
    timestamp: Date.now(),
    formattedDate,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: comment?.trim() || `Status updated from "${previousStatus}" to "${newStatus}"`,
  };

  if (!lead.activityLog || !Array.isArray(lead.activityLog)) {
    lead.activityLog = ensureLeadActivityLog(lead);
  }
  lead.activityLog.unshift(activityItem);

  saveDB(db);
  res.json({ success: true, lead, activity: activityItem });
});

// 1.35 Update lead quality category (Normal, Average, Potential, Very potential)
app.put('/api/leads/:id/category', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { category: rawCategory } = req.body;
  const validCategories = ['Normal', 'Average', 'Potential', 'Very potential'];
  const category = validCategories.find(c => c.toLowerCase() === String(rawCategory).toLowerCase().trim()) || 'Normal';

  const db = loadDB();
  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const previousCategory = lead.clientCategory || 'Normal';
  lead.clientCategory = category;

  const actor = (req as any).user;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const activityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: lead.id,
    type: 'note',
    previousStatus: lead.status || 'WP Connect',
    newStatus: lead.status || 'WP Connect',
    timestamp: Date.now(),
    formattedDate,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: `Category updated from "${previousCategory}" to "${category}"`,
  };

  if (!lead.activityLog || !Array.isArray(lead.activityLog)) {
    lead.activityLog = ensureLeadActivityLog(lead);
  }
  lead.activityLog.unshift(activityItem);

  saveDB(db);
  res.json({ success: true, lead, activity: activityItem, category });
});

// 1.4 Post manual note/activity to lead log
app.post('/api/leads/:id/activities', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { type = 'note', previousStatus, newStatus, comment } = req.body;

  const db = loadDB();
  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const actor = (req as any).user;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currStatus = lead.status || 'active';
  const targetStatus = newStatus || currStatus;

  const activityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: lead.id,
    type: type || 'note',
    previousStatus: previousStatus || currStatus,
    newStatus: targetStatus,
    timestamp: Date.now(),
    formattedDate,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: comment?.trim() || 'Activity logged',
  };

  if (newStatus && newStatus !== lead.status) {
    lead.status = newStatus;
  }

  if (!lead.activityLog || !Array.isArray(lead.activityLog)) {
    lead.activityLog = ensureLeadActivityLog(lead);
  }
  lead.activityLog.unshift(activityItem);

  saveDB(db);
  res.json({ success: true, lead, activity: activityItem });
});

// 2. Create a new lead
app.post('/api/leads', authMiddleware, (req, res) => {
  const data = req.body;
  const db = loadDB();

  if (!data.name || !data.phone || !data.category) {
    return res.status(400).json({ error: 'Name, Phone Number, and Lead Source are required' });
  }

  // File type and security validation
  if (data.pdf) {
    if (!data.pdf.name || !data.pdf.name.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Security validation failed: Only authentic PDF format (.pdf) is permitted for PDF document upload.' });
    }
  }

  const nextSerial = db.nextLeadSerial || ((db.leads || []).length + 1);
  db.nextLeadSerial = nextSerial + 1;

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const formattedDateTime = `${formattedDate} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const leadId = `LD-${String(nextSerial).padStart(4, '0')}`;

  const creator = (req as any).user;
  const creatorName = creator?.name || 'Sohag';
  const creatorRole = creator?.role || 'Super Admin';

  const { percentage, stars } = computeLeadCompleteness(data);

  const initialStatus = data.status || 'WP Connect';

  const newLead = {
    id: leadId,
    serialNumber: nextSerial,
    createdAt: formattedDate,
    createdTimestamp: Date.now(),
    name: String(data.name).trim(),
    phone: String(data.phone).trim(),
    email: data.email ? String(data.email).trim() : '',
    category: String(data.category || 'FB Message').trim(),
    profession: data.profession || '',
    dateOfBirth: data.dateOfBirth || '',
    maritalStatus: data.maritalStatus || '',
    gender: data.gender || '',
    height: data.height || '',
    religion: data.religion || '',
    qualification: data.qualification || '',
    presentCity: data.presentCity || '',
    presentCountry: data.presentCountry || 'Bangladesh',
    permanentCity: data.permanentCity || '',
    permanentCountry: data.permanentCountry || 'Bangladesh',
    images: Array.isArray(data.images) ? data.images : [],
    pdf: data.pdf || null,
    createdBy: creatorName,
    creatorRole: creatorRole,
    creatorId: creator?.id || '',
    status: initialStatus,
    clientCategory: data.clientCategory || 'Normal',
    completeness: percentage,
    stars,
    activityLog: [
      {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        leadId: leadId,
        type: 'created',
        previousStatus: null,
        newStatus: initialStatus,
        timestamp: Date.now(),
        formattedDate: formattedDateTime,
        user: {
          id: creator?.id || 'usr_staff',
          name: creatorName,
          role: creatorRole,
          phone: creator?.phone || '',
        },
        comment: 'Initial lead registration created in CRM system',
      },
    ],
  };

  if (!db.leads) db.leads = [];
  db.leads.push(newLead);
  saveDB(db);
  res.status(201).json(newLead);
});

// 3. Update an existing lead
app.put('/api/leads/:id', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role === 'CRO' || actor.role === 'MK') {
    return res.status(403).json({ error: 'Permission denied: CRO and MK accounts are not permitted to edit leads.' });
  }

  const { id } = req.params;
  const updates = req.body;
  const db = loadDB();

  const index = (db.leads || []).findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const existing = db.leads[index];
  const previousStatus = existing.status || 'active';
  const newStatus = updates.status !== undefined ? updates.status : previousStatus;

  const merged = {
    ...existing,
    ...updates,
    id: existing.id,
    serialNumber: existing.serialNumber,
    createdAt: existing.createdAt,
    createdTimestamp: existing.createdTimestamp,
    createdBy: existing.createdBy,
    creatorRole: existing.creatorRole,
    status: newStatus,
  };

  const { percentage, stars } = computeLeadCompleteness(merged);
  merged.completeness = percentage;
  merged.stars = stars;

  if (!merged.activityLog || !Array.isArray(merged.activityLog)) {
    merged.activityLog = ensureLeadActivityLog(merged);
  }

  // If status changed in update payload, log transition
  if (updates.status && updates.status !== previousStatus) {
    const actor = (req as any).user;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    merged.activityLog.unshift({
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      leadId: existing.id,
      type: 'status_change',
      previousStatus,
      newStatus,
      timestamp: Date.now(),
      formattedDate,
      user: {
        id: actor?.id || 'usr_staff',
        name: actor?.name || 'Staff Member',
        role: actor?.role || 'Super Admin',
        phone: actor?.phone || '',
      },
      comment: updates.statusComment || `Status updated from "${previousStatus}" to "${newStatus}"`,
    });
  }

  db.leads[index] = merged;
  saveDB(db);
  res.json(merged);
});

// 4. Move lead to trash (Trush bin)
app.put('/api/leads/:id/remove', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role === 'CRO' || actor.role === 'MK') {
    return res.status(403).json({ error: 'Permission denied: CRO and MK accounts are not permitted to delete leads.' });
  }

  const { id } = req.params;
  const db = loadDB();

  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const previousStatus = lead.status || 'active';
  const now = new Date();
  const deletedTimestamp = Date.now();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  lead.status = 'trash';
  lead.deletedAt = deletedTimestamp;
  lead.trashCategory = 'Lead';
  lead.deletedBy = {
    id: actor?.id || 'usr_staff',
    name: actor?.name || 'Staff Member',
    role: actor?.role || 'Super Admin',
  };

  if (!lead.activityLog || !Array.isArray(lead.activityLog)) {
    lead.activityLog = ensureLeadActivityLog(lead);
  }

  lead.activityLog.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: lead.id,
    type: 'status_change',
    previousStatus,
    newStatus: 'trash',
    timestamp: deletedTimestamp,
    formattedDate,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: 'Lead moved to Trash Bin',
  });

  saveDB(db);
  res.json({ success: true, message: 'Lead moved to trash', lead });
});

// Alias for DELETE /api/leads/:id to move to trash
app.delete('/api/leads/:id', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role === 'CRO' || actor.role === 'MK') {
    return res.status(403).json({ error: 'Permission denied: CRO and MK accounts are not permitted to delete leads.' });
  }

  const { id } = req.params;
  const db = loadDB();

  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const previousStatus = lead.status || 'active';
  const now = new Date();
  const deletedTimestamp = Date.now();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  lead.status = 'trash';
  lead.deletedAt = deletedTimestamp;
  lead.trashCategory = 'Lead';
  lead.deletedBy = {
    id: actor?.id || 'usr_staff',
    name: actor?.name || 'Staff Member',
    role: actor?.role || 'Super Admin',
  };

  if (!lead.activityLog || !Array.isArray(lead.activityLog)) {
    lead.activityLog = ensureLeadActivityLog(lead);
  }

  lead.activityLog.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: lead.id,
    type: 'status_change',
    previousStatus,
    newStatus: 'trash',
    timestamp: deletedTimestamp,
    formattedDate,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: 'Lead moved to Trash Bin',
  });

  saveDB(db);
  res.json({ success: true, message: 'Lead moved to trash', lead });
});

// 5. Convert lead to traffic
app.post('/api/leads/:id/convert-traffic', authMiddleware, (req, res) => {
  const { id } = req.params;
  const trafficData = req.body;
  const db = loadDB();

  const leadIndex = (db.leads || []).findIndex(l => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const lead = db.leads[leadIndex];

  // Validation layer: prevent transfer to Traffic section unless all mandatory traffic-specific fields are filled
  const missingRequirements: string[] = [];

  const finalName = String(trafficData.name || lead.name || '').trim();
  const finalPhone = String(trafficData.phone || lead.phone || '').trim();
  const finalEmail = String(trafficData.email || lead.email || '').trim();
  const finalAssignBy = String(trafficData.assignBy || '').trim();
  const finalProfession = String(trafficData.profession || lead.profession || '').trim();
  const finalJobType = String(trafficData.jobType || lead.jobType || '').trim();
  const finalDateOfBirth = String(trafficData.dateOfBirth || lead.dateOfBirth || '').trim();
  const finalMaritalStatus = String(trafficData.maritalStatus || lead.maritalStatus || '').trim();
  const finalGender = String(trafficData.gender || lead.gender || '').trim();
  const finalBodyColor = String(trafficData.bodyColor || lead.bodyColor || '').trim();
  const finalHeight = String(trafficData.height || lead.height || '').trim();
  const finalReligion = String(trafficData.religion || lead.religion || '').trim();
  const finalBloodGroup = String(trafficData.bloodGroup || lead.bloodGroup || '').trim();
  const finalQualification = String(trafficData.qualification || lead.qualification || '').trim();
  const finalRequirement = String(trafficData.requirement || lead.requirement || '').trim();
  const finalPresentCity = String(trafficData.presentCity || lead.presentCity || '').trim();
  const finalPresentCountry = String(trafficData.presentCountry || lead.presentCountry || '').trim();
  const finalPermanentCity = String(trafficData.permanentCity || lead.permanentCity || '').trim();
  const finalPermanentCountry = String(trafficData.permanentCountry || lead.permanentCountry || '').trim();
  const finalImages = Array.isArray(trafficData.images) && trafficData.images.length > 0 ? trafficData.images : (lead.images || []);
  const finalPdf = trafficData.pdf || lead.pdf || null;
  const price = Number(trafficData.price) || 0;

  if (!finalName) missingRequirements.push('Candidate Name');
  if (!finalPhone) missingRequirements.push('Phone Number');
  if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) missingRequirements.push('Valid Email Address');
  if (!finalAssignBy) missingRequirements.push('Assign By (MK Role Account)');
  if (!finalProfession) missingRequirements.push('Profession');
  if (!finalJobType) missingRequirements.push('Job Type');
  if (!finalDateOfBirth) missingRequirements.push('Date of Birth');
  if (!finalMaritalStatus) missingRequirements.push('Marital Status');
  if (!finalGender) missingRequirements.push('Gender');
  if (!finalBodyColor) missingRequirements.push('Body Color');
  if (!finalHeight) missingRequirements.push('Height');
  if (!finalReligion) missingRequirements.push('Religion');
  if (!finalBloodGroup) missingRequirements.push('Blood Group');
  if (!finalQualification) missingRequirements.push('Educational Qualification');
  if (!finalRequirement) missingRequirements.push('Partner Requirement');
  if (!finalPresentCity || !finalPresentCountry) missingRequirements.push('Present Address (City & Country)');
  if (!finalPermanentCity || !finalPermanentCountry) missingRequirements.push('Permanent Address (City & Country)');
  if (!Array.isArray(finalImages) || finalImages.length === 0) missingRequirements.push('Picture Upload (at least 1 image)');
  if (!finalPdf || (!finalPdf.dataUrl && !finalPdf.name)) missingRequirements.push('PDF Biodata Document');

  if (missingRequirements.length > 0) {
    return res.status(400).json({
      error: `Transfer to Traffic blocked: ${missingRequirements.length} mandatory requirement(s) are missing.`,
      missingRequirements,
    });
  }

  // Merge lead data with traffic conversion data
  const serialNumber = db.nextSerial || 1;
  db.nextSerial = serialNumber + 1;

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const trafficId = `SK-${String(serialNumber).padStart(4, '0')}`;

  const discount = Number(trafficData.discount) || 0;
  const paidAmount = Number(trafficData.paidAmount) || 0;
  const dueAmount = Math.max(0, price - discount - paidAmount);
  const afterMarriageFee = Number(trafficData.afterMarriageFee) || 0;

  const creator = (req as any).user;
  const creatorName = creator?.name || lead.createdBy || 'Sohag';
  const creatorRole = creator?.role || lead.creatorRole || 'Super Admin';
  const actor = (req as any).user;
  const formattedDateTime = `${formattedDate} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 1. Ensure lead activity log is initialized
  if (!lead.activityLog || !Array.isArray(lead.activityLog)) {
    lead.activityLog = ensureLeadActivityLog(lead);
  }

  // 2. Exact status preservation: whichever status station the lead was in, maintain that exact status!
  const preservedStatus = trafficData.status || lead.status || 'WP Connect';

  // 3. Clone lead's historical activities
  const leadHistoricalActivities = lead.activityLog.map((act: any) => ({
    ...act,
    originalLeadId: lead.id,
  }));

  // 4. Create transfer transition log entry for traffic
  const transferActivityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: trafficId,
    type: 'status_change',
    previousStatus: preservedStatus,
    newStatus: preservedStatus,
    timestamp: Date.now(),
    formattedDate: formattedDateTime,
    user: {
      id: actor?.id || 'usr_staff',
      name: creatorName,
      role: creatorRole,
      phone: creator?.phone || '',
    },
    comment: `Transferred from Lead (${lead.id}) to Traffic with Status maintained at "${preservedStatus}"${trafficData.package ? ` (${trafficData.package} Package)` : ''}${trafficData.assignBy ? ` (Assigned to ${trafficData.assignBy})` : ''}`,
  };

  const newTraffic = {
    id: trafficId,
    serialNumber,
    createdAt: formattedDate,
    createdTimestamp: Date.now(),
    name: trafficData.name || lead.name,
    phone: trafficData.phone || lead.phone,
    email: trafficData.email || lead.email || '',
    createdBy: creatorName,
    creatorRole: creatorRole,
    assignBy: trafficData.assignBy || '',
    profession: trafficData.profession || lead.profession || '',
    jobType: trafficData.jobType || 'Full Time',
    dateOfBirth: trafficData.dateOfBirth || lead.dateOfBirth || '',
    maritalStatus: trafficData.maritalStatus || lead.maritalStatus || '',
    gender: trafficData.gender || lead.gender || '',
    bodyColor: trafficData.bodyColor || 'Fair',
    height: trafficData.height || lead.height || '',
    religion: trafficData.religion || lead.religion || '',
    bloodGroup: trafficData.bloodGroup || 'O+',
    qualification: trafficData.qualification || lead.qualification || '',
    requirement: trafficData.requirement || lead.requirement || '',
    presentCity: trafficData.presentCity || lead.presentCity || '',
    presentCountry: trafficData.presentCountry || lead.presentCountry || 'Bangladesh',
    permanentCity: trafficData.permanentCity || lead.permanentCity || '',
    permanentCountry: trafficData.permanentCountry || lead.permanentCountry || 'Bangladesh',
    images: Array.isArray(trafficData.images) && trafficData.images.length > 0 ? trafficData.images : (lead.images || []),
    pdf: trafficData.pdf || lead.pdf || null,
    package: trafficData.package || '',
    price,
    discount,
    dueAmount,
    paidAmount,
    paymentMethod: trafficData.paymentMethod || '',
    afterMarriageFee,
    paymentStatus: paidAmount > 0 ? 'pending' : 'unpaid',
    assignedTo: trafficData.assignBy ? { name: trafficData.assignBy, role: 'MK' } : null,
    status: preservedStatus,
    clientCategory: trafficData.clientCategory || lead.clientCategory || 'Normal',
    activityLog: [transferActivityItem, ...leadHistoricalActivities],
    convertedFromLeadId: lead.id,
  };

  db.traffics.push(newTraffic);

  // Generate Payment Request only if a payment was explicitly submitted
  if (paidAmount > 0) {
    const newPaymentRequest = {
      id: `PR-${String(db.paymentRequests.length + 1).padStart(4, '0')}`,
      trafficId: newTraffic.id,
      trafficName: newTraffic.name,
      phone: newTraffic.phone,
      date: formattedDate,
      paidAmount,
      dueAmount,
      afterMarriageFee,
      package: newTraffic.package || 'Standard',
      paymentMethod: newTraffic.paymentMethod || 'bKash',
      assignedBy: newTraffic.assignBy || creatorName,
      createdBy: creatorName,
      creatorRole: creatorRole,
      role: creatorRole,
      status: 'pending',
      images: newTraffic.images || [],
      gender: newTraffic.gender || '',
    };
    db.paymentRequests.push(newPaymentRequest);
  }

  // Mark lead as converted
  const previousStatus = lead.status || 'active';
  lead.status = 'converted';
  lead.convertedToTrafficId = newTraffic.id;

  if (!lead.activityLog || !Array.isArray(lead.activityLog)) {
    lead.activityLog = ensureLeadActivityLog(lead);
  }

  lead.activityLog.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: lead.id,
    type: 'status_change',
    previousStatus,
    newStatus: 'converted',
    timestamp: Date.now(),
    formattedDate: formattedDateTime,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || creatorName,
      role: actor?.role || creatorRole,
      phone: actor?.phone || '',
    },
    comment: `Lead successfully converted to Traffic Candidate ${newTraffic.id}${newTraffic.package ? ` (${newTraffic.package} Package)` : ''} (Assigned to ${newTraffic.assignBy || 'MK'})`,
  });

  saveDB(db);
  res.json({ success: true, traffic: newTraffic, lead });
});

// --- TRAFFIC API ---
app.get('/api/traffic', authMiddleware, (req, res) => {
  const db = loadDB();
  const actor = (req as any).user;
  // Filter out records marked as trash AND records that have been accepted/moved to Paid Traffic
  let activeTraffics = (db.traffics || [])
    .filter(t => t.status !== 'trash' && t.paymentStatus !== 'accepted');

  if (actor.role === 'CRO') {
    activeTraffics = activeTraffics.filter(t => {
      if (t.creatorId) return t.creatorId === actor.id;
      return t.createdBy === actor.name;
    });
  } else if (actor.role === 'MK') {
    activeTraffics = activeTraffics.filter(t => {
      const isCreator = (t.creatorId && t.creatorId === actor.id) || t.createdBy === actor.name;
      const isAssigned = (t.assignedTo?.id && t.assignedTo?.id === actor.id) ||
                         (t.assignedTo?.name && t.assignedTo?.name === actor.name) ||
                         t.assignBy === actor.name;
      return isCreator || isAssigned;
    });
  }

  const result = activeTraffics
    // Sequential order (1, 2, 3...) with newest at the bottom as requested
    .sort((a, b) => a.serialNumber - b.serialNumber)
    .map(t => ({
      ...t,
      status: t.status || 'WP Connect',
      clientCategory: t.clientCategory || 'Normal',
      activityLog: ensureTrafficActivityLog(t),
      createdBy: t.createdBy || 'Sohag',
      creatorRole: t.creatorRole || 'Super Admin',
    }));

  res.json(result);
});

app.post('/api/traffic', authMiddleware, (req, res) => {
  const data = req.body;
  const db = loadDB();

  // Basic validation
  if (!data.name || !data.phone) {
    return res.status(400).json({ error: 'Name and Phone Number are required' });
  }

  // File type and security validation
  if (data.pdf) {
    if (!data.pdf.name || !data.pdf.name.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Security validation failed: Only authentic PDF format (.pdf) is permitted for PDF document upload.' });
    }
    if (data.pdf.dataUrl && !data.pdf.dataUrl.startsWith('data:application/pdf')) {
      return res.status(400).json({ error: 'Security validation failed: PDF data payload is invalid or spoofed.' });
    }
  }

  if (Array.isArray(data.images)) {
    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      if (typeof img !== 'string' || !img.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Security validation failed: Uploaded file is not an image.' });
      }
    }
  }

  const serialNumber = db.nextSerial || 1;
  db.nextSerial = serialNumber + 1;

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const trafficId = `SK-${String(serialNumber).padStart(4, '0')}`;

  const price = Number(data.price) || 0;
  const discount = Number(data.discount) || 0;
  const paidAmount = Number(data.paidAmount) || 0;
  const dueAmount = Math.max(0, price - discount - paidAmount);
  const afterMarriageFee = Number(data.afterMarriageFee) || 0;

  // The creator is the exact authenticated user account who submitted this traffic into CRM
  const creator = (req as any).user;
  const creatorName = creator?.name || data.createdByName || 'Sohag';
  const creatorRole = creator?.role || data.createdByRole || 'Super Admin';

  const newTraffic = {
    id: trafficId,
    serialNumber,
    createdAt: formattedDate,
    createdTimestamp: Date.now(),
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    // Exact CRM Account Person who added this traffic
    createdBy: creatorName,
    creatorRole: creatorRole,
    creatorId: creator?.id || '',
    // Assigned MK Account
    assignBy: data.assignBy || '',
    profession: data.profession || '',
    jobType: data.jobType || '',
    dateOfBirth: data.dateOfBirth || '',
    maritalStatus: data.maritalStatus || '',
    gender: data.gender || '',
    bodyColor: data.bodyColor || '',
    height: data.height || '',
    religion: data.religion || '',
    bloodGroup: data.bloodGroup || '',
    qualification: data.qualification || '',
    requirement: data.requirement || '',
    // Address
    presentCity: data.presentCity || '',
    presentCountry: data.presentCountry || '',
    permanentCity: data.permanentCity || '',
    permanentCountry: data.permanentCountry || '',
    // Uploads
    images: Array.isArray(data.images) ? data.images : [],
    pdf: data.pdf || null,
    // Payment
    package: data.package || '',
    price,
    discount,
    dueAmount,
    paidAmount,
    paymentMethod: data.paymentMethod || '',
    afterMarriageFee,
    // Status
    paymentStatus: paidAmount > 0 ? 'pending' : 'unpaid',
    assignedTo: data.assignBy ? { name: data.assignBy, role: 'MK' } : null,
    status: data.status || 'WP Connect',
    clientCategory: data.clientCategory || 'Normal',
    activityLog: [
      {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        leadId: trafficId,
        type: 'created',
        previousStatus: null,
        newStatus: data.status || 'WP Connect',
        timestamp: Date.now(),
        formattedDate: `${formattedDate} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        user: {
          id: creator?.id || 'usr_staff',
          name: creatorName,
          role: creatorRole,
          phone: creator?.phone || '',
        },
        comment: 'Traffic candidate profile registered in CRM system',
      },
    ],
  };

  db.traffics.push(newTraffic);

  // When a Traffic form is submitted with payment (paidAmount > 0), it becomes a Payment Request in Payment section
  if (paidAmount > 0) {
    if (!db.paymentRequests) db.paymentRequests = [];
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newPaymentRequest = {
      id: `PR-${String(db.paymentRequests.length + 1).padStart(4, '0')}`,
      trafficId: newTraffic.id,
      trafficName: newTraffic.name,
      phone: newTraffic.phone,
      date: formattedDate,
      formattedDate: `${formattedDate} ${formattedTime}`,
      timestamp: Date.now(),
      paidAmount,
      dueAmount,
      afterMarriageFee,
      package: newTraffic.package || 'Standard',
      paymentMethod: newTraffic.paymentMethod || 'bKash',
      assignedBy: newTraffic.assignBy || creatorName,
      createdBy: creatorName,
      creatorRole: creatorRole,
      creatorPhone: creator?.phone || '',
      creatorId: creator?.id || '',
      role: creatorRole,
      status: 'pending',
      images: newTraffic.images || [],
      gender: newTraffic.gender || '',
    };
    db.paymentRequests.push(newPaymentRequest);
  }

  saveDB(db);
  res.status(201).json(newTraffic);
});

// Update traffic profile
app.put('/api/traffic/:id', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role === 'CRO' || actor.role === 'MK') {
    return res.status(403).json({ error: 'Permission denied: CRO and MK accounts are not permitted to edit traffic.' });
  }

  const { id } = req.params;
  const updates = req.body;
  const db = loadDB();

  const index = db.traffics.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  const existing = db.traffics[index];
  const price = updates.price !== undefined ? Number(updates.price) : existing.price;
  const discount = updates.discount !== undefined ? Number(updates.discount) : existing.discount;
  const paidAmount = updates.paidAmount !== undefined ? Number(updates.paidAmount) : existing.paidAmount;
  const dueAmount = Math.max(0, price - discount - paidAmount);
  const afterMarriageFee = updates.afterMarriageFee !== undefined ? Number(updates.afterMarriageFee) : (existing.afterMarriageFee || 0);

  const actorName = actor?.name || updates.createdByName || existing.createdBy || 'Sohag';
  const actorRole = actor?.role || updates.createdByRole || existing.creatorRole || 'Super Admin';
  const actorPhone = actor?.phone || '';
  const actorId = actor?.id || '';

  // Determine updated payment status
  let updatedPaymentStatus = existing.paymentStatus || 'unpaid';
  if (existing.paymentStatus !== 'accepted') {
    updatedPaymentStatus = paidAmount > 0 ? 'pending' : 'unpaid';
  }

  db.traffics[index] = {
    ...existing,
    ...updates,
    price,
    discount,
    paidAmount,
    dueAmount,
    afterMarriageFee,
    paymentStatus: updatedPaymentStatus,
    id: existing.id,
    serialNumber: existing.serialNumber,
    createdTimestamp: existing.createdTimestamp,
  };

  // Sync with Payment Requests table
  if (!db.paymentRequests) db.paymentRequests = [];

  if (paidAmount > 0 && existing.paymentStatus !== 'accepted') {
    const existingReqIndex = db.paymentRequests.findIndex(
      (pr: any) => pr.status === 'pending' && (pr.trafficId === existing.id || (pr.phone && pr.phone === existing.phone))
    );

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (existingReqIndex !== -1) {
      // Update existing pending payment request
      db.paymentRequests[existingReqIndex] = {
        ...db.paymentRequests[existingReqIndex],
        trafficName: db.traffics[index].name,
        phone: db.traffics[index].phone,
        package: db.traffics[index].package || 'Standard',
        paidAmount,
        dueAmount,
        afterMarriageFee,
        paymentMethod: db.traffics[index].paymentMethod || 'bKash',
        assignedBy: db.traffics[index].assignBy || actorName,
        images: db.traffics[index].images || [],
        gender: db.traffics[index].gender || '',
        formattedDate: `${formattedDate} ${formattedTime}`,
        timestamp: Date.now(),
      };
    } else {
      // Create a brand new pending payment request
      const newPR = {
        id: `PR-${String(db.paymentRequests.length + 1).padStart(4, '0')}`,
        trafficId: existing.id,
        trafficName: db.traffics[index].name,
        phone: db.traffics[index].phone,
        date: formattedDate,
        formattedDate: `${formattedDate} ${formattedTime}`,
        timestamp: Date.now(),
        paidAmount,
        dueAmount,
        afterMarriageFee,
        package: db.traffics[index].package || 'Standard',
        paymentMethod: db.traffics[index].paymentMethod || 'bKash',
        assignedBy: db.traffics[index].assignBy || actorName,
        createdBy: actorName,
        creatorRole: actorRole,
        creatorPhone: actorPhone,
        creatorId: actorId,
        role: actorRole,
        status: 'pending',
        images: db.traffics[index].images || [],
        gender: db.traffics[index].gender || '',
      };
      db.paymentRequests.push(newPR);
    }
  }

  saveDB(db);
  res.json(db.traffics[index]);
});

// Transfer traffic to selected CRO or MK account
app.put('/api/traffic/:id/transfer', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role === 'CRO' || actor.role === 'MK') {
    return res.status(403).json({ error: 'Permission denied: CRO and MK accounts are not permitted to transfer traffic.' });
  }

  const { id } = req.params;
  const { targetAccountId, targetAccountName, targetRole } = req.body;
  if (!targetAccountName || !targetRole) {
    return res.status(400).json({ error: 'Target account and role are required' });
  }

  const db = loadDB();
  const traffic = db.traffics.find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  traffic.assignedTo = {
    id: targetAccountId || '',
    name: targetAccountName,
    role: targetRole,
  };
  traffic.assignBy = targetAccountName;

  if (!traffic.activityLog || !Array.isArray(traffic.activityLog)) {
    traffic.activityLog = ensureTrafficActivityLog(traffic);
  }
  const now = new Date();
  const formattedDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  traffic.activityLog.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: traffic.id,
    type: 'note',
    previousStatus: traffic.status || 'WP Connect',
    newStatus: traffic.status || 'WP Connect',
    timestamp: Date.now(),
    formattedDate: formattedDateTime,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: `Transferred to ${targetAccountName} (${targetRole})`,
  });

  saveDB(db);
  res.json({ success: true, traffic });
});

// Remove traffic (move to Trush bin)
app.put('/api/traffic/:id/remove', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role === 'CRO' || actor.role === 'MK') {
    return res.status(403).json({ error: 'Permission denied: CRO and MK accounts are not permitted to delete traffic.' });
  }

  const { id } = req.params;
  const db = loadDB();

  const traffic = db.traffics.find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  const now = new Date();
  const formattedDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  traffic.status = 'trash';
  traffic.deletedAt = Date.now();
  traffic.trashCategory = 'Traffic';
  traffic.deletedBy = {
    id: actor?.id || 'usr_staff',
    name: actor?.name || 'Staff Member',
    role: actor?.role || 'Super Admin',
  };

  if (!traffic.activityLog || !Array.isArray(traffic.activityLog)) {
    traffic.activityLog = ensureTrafficActivityLog(traffic);
  }
  traffic.activityLog.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: traffic.id,
    type: 'status_change',
    previousStatus: traffic.status || 'WP Connect',
    newStatus: 'trash',
    timestamp: Date.now(),
    formattedDate: formattedDateTime,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: 'Candidate moved to Trash bin',
  });

  saveDB(db);
  res.json({ success: true, message: 'Moved to Trush bin', traffic });
});

// Update traffic status and record transition in activity log (matching lead section)
app.put('/api/traffic/:id/status', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status: newStatus, comment } = req.body;
  if (!newStatus) {
    return res.status(400).json({ error: 'New status is required' });
  }

  const db = loadDB();
  const traffic = (db.traffics || []).find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  const previousStatus = traffic.status || 'WP Connect';
  traffic.status = newStatus;

  const actor = (req as any).user;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const activityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: traffic.id,
    type: 'status_change',
    previousStatus,
    newStatus,
    timestamp: Date.now(),
    formattedDate,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: comment?.trim() || `Status updated from "${previousStatus}" to "${newStatus}"`,
  };

  if (!traffic.activityLog || !Array.isArray(traffic.activityLog)) {
    traffic.activityLog = ensureTrafficActivityLog(traffic);
  }
  traffic.activityLog.unshift(activityItem);

  saveDB(db);
  res.json({ success: true, traffic, lead: traffic, activity: activityItem });
});

// Update traffic quality category (Normal, Average, Potential, Very potential)
app.put('/api/traffic/:id/category', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { category: rawCategory } = req.body;
  const validCategories = ['Normal', 'Average', 'Potential', 'Very potential'];
  const category = validCategories.find(c => c.toLowerCase() === String(rawCategory).toLowerCase().trim()) || 'Normal';

  const db = loadDB();
  const traffic = (db.traffics || []).find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  const previousCategory = traffic.clientCategory || 'Normal';
  traffic.clientCategory = category;

  const actor = (req as any).user;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const activityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: traffic.id,
    type: 'note',
    previousStatus: traffic.status || 'WP Connect',
    newStatus: traffic.status || 'WP Connect',
    timestamp: Date.now(),
    formattedDate,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: `Category updated from "${previousCategory}" to "${category}"`,
  };

  if (!traffic.activityLog || !Array.isArray(traffic.activityLog)) {
    traffic.activityLog = ensureTrafficActivityLog(traffic);
  }
  traffic.activityLog.unshift(activityItem);

  saveDB(db);
  res.json({ success: true, traffic, activity: activityItem, category });
});

// Post manual note or activity for traffic
app.post('/api/traffic/:id/activities', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { type = 'note', previousStatus, newStatus, comment } = req.body;

  const db = loadDB();
  const traffic = (db.traffics || []).find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  const actor = (req as any).user;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currStatus = traffic.status || 'WP Connect';
  const targetStatus = newStatus || currStatus;

  const activityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: traffic.id,
    type: type || 'note',
    previousStatus: previousStatus || currStatus,
    newStatus: targetStatus,
    timestamp: Date.now(),
    formattedDate,
    user: {
      id: actor?.id || 'usr_staff',
      name: actor?.name || 'Staff Member',
      role: actor?.role || 'Super Admin',
      phone: actor?.phone || '',
    },
    comment: comment?.trim() || 'Internal operational note',
  };

  if (!traffic.activityLog || !Array.isArray(traffic.activityLog)) {
    traffic.activityLog = ensureTrafficActivityLog(traffic);
  }
  traffic.activityLog.unshift(activityItem);

  saveDB(db);
  res.json({ success: true, traffic, lead: traffic, activity: activityItem });
});

// --- PAYMENT API ---
app.get('/api/payments/requests', authMiddleware, (req, res) => {
  const db = loadDB();
  const actor = (req as any).user;
  if (actor?.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Permission denied: Only Super Admin can view payment requests.' });
  }

  let pending = (db.paymentRequests || [])
    .filter(pr => pr.status === 'pending');

  const result = pending.map(pr => {
      const matched = (db.traffics || []).find(
        t => t.id === pr.trafficId || (t.phone && pr.phone && t.phone === pr.phone) || (t.name && pr.trafficName && t.name === pr.trafficName)
      );

      // Resolve creator user account from db.users
      const creatorUser = pr.creatorId
        ? (db.users || []).find(u => u.id === pr.creatorId)
        : (db.users || []).find(u => u.name === pr.createdBy);

      const creatorName = pr.createdBy || creatorUser?.name || matched?.createdBy || pr.assignedBy || 'Sohag';
      const creatorRole = pr.creatorRole || pr.role || creatorUser?.role || matched?.creatorRole || 'Super Admin';
      const creatorPhone = pr.creatorPhone || creatorUser?.phone || (creatorName === 'Sohag' ? '01711000000' : '');

      return {
        ...pr,
        trafficName: pr.trafficName || matched?.name || 'Candidate',
        trafficId: pr.trafficId || matched?.id || '',
        phone: pr.phone || matched?.phone || '',
        images: (matched?.images && matched.images.length > 0) ? matched.images : (pr.images || []),
        gender: matched?.gender || pr.gender || '',
        profession: matched?.profession || '',
        package: pr.package || matched?.package || 'Standard',
        paidAmount: Number(pr.paidAmount) || 0,
        dueAmount: Number(pr.dueAmount) || 0,
        afterMarriageFee: Number(pr.afterMarriageFee) || 0,
        paymentMethod: pr.paymentMethod || 'bKash',
        // Creator/Sender account details
        createdBy: creatorName,
        creatorRole: creatorRole,
        creatorPhone: creatorPhone,
        creatorId: pr.creatorId || creatorUser?.id || '',
        date: pr.date || matched?.createdAt || '',
        formattedDate: pr.formattedDate || pr.date || '',
        timestamp: pr.timestamp || (matched?.createdTimestamp || Date.now()),
      };
    });
  res.json(result);
});

// Endpoint to submit a new Payment Request manually
app.post('/api/payments/requests', authMiddleware, (req, res) => {
  const db = loadDB();
  const creator = (req as any).user;
  const creatorName = creator?.name || 'Sohag';
  const creatorRole = creator?.role || 'Super Admin';
  const creatorPhone = creator?.phone || '';
  const creatorId = creator?.id || '';

  const {
    trafficId,
    trafficName,
    phone,
    paidAmount,
    dueAmount,
    afterMarriageFee,
    package: pkg,
    paymentMethod,
    note,
  } = req.body;

  if (!trafficName && !trafficId) {
    return res.status(400).json({ error: 'Candidate Name or Traffic ID is required' });
  }

  const numericPaid = Number(paidAmount) || 0;
  if (numericPaid <= 0) {
    return res.status(400).json({ error: 'Valid paid amount greater than 0 is required' });
  }

  const matched = (db.traffics || []).find(
    t => (trafficId && t.id === trafficId) || (phone && t.phone === phone) || (trafficName && t.name === trafficName)
  );

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const calculatedDue = dueAmount !== undefined ? Number(dueAmount) : Math.max(0, (matched?.price || 0) - (matched?.discount || 0) - numericPaid);
  const pkgName = pkg || matched?.package || 'Standard';
  const method = paymentMethod || matched?.paymentMethod || 'bKash';
  const marriageFee = afterMarriageFee !== undefined ? Number(afterMarriageFee) : (matched?.afterMarriageFee || 0);

  if (matched) {
    matched.paymentStatus = 'pending';
    matched.paidAmount = numericPaid;
    matched.dueAmount = calculatedDue;
    matched.package = pkgName;
    matched.paymentMethod = method;
    matched.afterMarriageFee = marriageFee;
  }

  if (!db.paymentRequests) db.paymentRequests = [];

  // Check if there is already a pending request for this traffic or candidate
  const existingPendingIndex = db.paymentRequests.findIndex(
    (pr: any) => pr.status === 'pending' && (
      (trafficId && pr.trafficId === trafficId) ||
      (matched?.id && pr.trafficId === matched.id) ||
      (phone && pr.phone === phone) ||
      (trafficName && pr.trafficName === trafficName)
    )
  );

  let responseReq: any = null;

  if (existingPendingIndex !== -1) {
    // Update the existing pending request
    db.paymentRequests[existingPendingIndex] = {
      ...db.paymentRequests[existingPendingIndex],
      trafficId: trafficId || matched?.id || db.paymentRequests[existingPendingIndex].trafficId,
      trafficName: trafficName || matched?.name || db.paymentRequests[existingPendingIndex].trafficName,
      phone: phone || matched?.phone || db.paymentRequests[existingPendingIndex].phone,
      paidAmount: numericPaid,
      dueAmount: calculatedDue,
      afterMarriageFee: marriageFee,
      package: pkgName,
      paymentMethod: method,
      assignedBy: matched?.assignBy || creatorName,
      createdBy: creatorName,
      creatorRole: creatorRole,
      creatorPhone,
      creatorId,
      role: creatorRole,
      note: note || db.paymentRequests[existingPendingIndex].note || '',
      images: (matched?.images && matched.images.length > 0) ? matched.images : db.paymentRequests[existingPendingIndex].images,
      gender: matched?.gender || db.paymentRequests[existingPendingIndex].gender || '',
      formattedDate: `${formattedDate} ${formattedTime}`,
      timestamp: Date.now(),
    };
    responseReq = db.paymentRequests[existingPendingIndex];
  } else {
    const newId = `PR-${String((db.paymentRequests || []).length + 1).padStart(4, '0')}`;
    const newReq = {
      id: newId,
      trafficId: trafficId || matched?.id || '',
      trafficName: trafficName || matched?.name || 'Candidate',
      phone: phone || matched?.phone || '',
      date: formattedDate,
      formattedDate: `${formattedDate} ${formattedTime}`,
      timestamp: Date.now(),
      paidAmount: numericPaid,
      dueAmount: calculatedDue,
      afterMarriageFee: marriageFee,
      package: pkgName,
      paymentMethod: method,
      assignedBy: matched?.assignBy || creatorName,
      createdBy: creatorName,
      creatorRole: creatorRole,
      creatorPhone,
      creatorId,
      role: creatorRole,
      note: note || '',
      status: 'pending',
      images: (matched?.images && matched.images.length > 0) ? matched.images : [],
      gender: matched?.gender || '',
    };
    db.paymentRequests.push(newReq);
    responseReq = newReq;
  }

  saveDB(db);

  res.status(201).json({ success: true, paymentRequest: responseReq });
});

app.post('/api/payments/requests/:id/accept', authMiddleware, (req, res) => {
  const approver = (req as any).user;
  if (approver.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Permission denied: Only Super Admin can accept payment requests.' });
  }

  const { id } = req.params;
  const db = loadDB();

  const reqIndex = db.paymentRequests.findIndex(pr => pr.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Payment request not found' });
  }

  const paymentReq = db.paymentRequests[reqIndex];
  paymentReq.status = 'accepted';
  paymentReq.acceptedBy = approver?.name || 'Admin';
  paymentReq.acceptedAt = new Date().toISOString();

  // Find linked traffic record
  let traffic = db.traffics.find(t => (paymentReq.trafficId && t.id === paymentReq.trafficId)) ||
    db.traffics.find(t => (t.phone && paymentReq.phone && t.phone === paymentReq.phone)) ||
    db.traffics.find(t => (t.name && paymentReq.trafficName && t.name === paymentReq.trafficName));

  const creatorName = paymentReq.createdBy || paymentReq.assignedBy || traffic?.createdBy || traffic?.assignBy || 'Sohag';
  const creatorRole = paymentReq.creatorRole || paymentReq.role || traffic?.creatorRole || 'Super Admin';
  const candidateImages = (traffic?.images && traffic.images.length > 0)
    ? traffic.images
    : (paymentReq.images || []);

  if (traffic) {
    // Move from Traffic section to Paid Traffic section automatically
    traffic.paymentStatus = 'accepted';
    traffic.status = 'active';
    traffic.paidAmount = Math.max(Number(traffic.paidAmount) || 0, Number(paymentReq.paidAmount) || 0);
    traffic.dueAmount = Math.max(0, (Number(traffic.price) || 0) - (Number(traffic.discount) || 0) - (Number(traffic.paidAmount) || 0));
    if (paymentReq.package) traffic.package = paymentReq.package;
    if (paymentReq.paymentMethod) traffic.paymentMethod = paymentReq.paymentMethod;
    if (paymentReq.afterMarriageFee !== undefined) traffic.afterMarriageFee = Number(paymentReq.afterMarriageFee);
    if (!traffic.assignedTo && (paymentReq.assignedBy || traffic.assignBy)) {
      traffic.assignedTo = { name: paymentReq.assignedBy || traffic.assignBy, role: 'MK' };
    }
    traffic.movedToPaidAt = Date.now();
    paymentReq.trafficId = traffic.id;
  } else {
    // If candidate not found in traffics, create the verified candidate directly in db.traffics with accepted payment status
    const serialNumber = db.nextSerial || ((db.traffics || []).length + 1);
    db.nextSerial = serialNumber + 1;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    traffic = {
      id: paymentReq.trafficId || `SK-${String(serialNumber).padStart(4, '0')}`,
      serialNumber,
      createdAt: paymentReq.date || formattedDate,
      createdTimestamp: Date.now(),
      name: paymentReq.trafficName || 'Candidate',
      phone: paymentReq.phone || '',
      createdBy: creatorName,
      creatorRole: creatorRole,
      assignBy: paymentReq.assignedBy || creatorName,
      assignedTo: { name: paymentReq.assignedBy || creatorName, role: 'MK' },
      package: paymentReq.package || 'Gold Package',
      price: (Number(paymentReq.paidAmount) || 0) + (Number(paymentReq.dueAmount) || 0),
      discount: 0,
      paidAmount: Number(paymentReq.paidAmount) || 0,
      dueAmount: Number(paymentReq.dueAmount) || 0,
      afterMarriageFee: Number(paymentReq.afterMarriageFee) || 0,
      paymentMethod: paymentReq.paymentMethod || 'bKash',
      paymentStatus: 'accepted',
      status: 'active',
      images: candidateImages,
      gender: paymentReq.gender || '',
      profession: paymentReq.profession || 'Professional',
      movedToPaidAt: Date.now(),
    };
    db.traffics.push(traffic);
    paymentReq.trafficId = traffic.id;
  }

  // Add to completed Payments table with exact candidate images & gender
  const newPayment = {
    id: `PAY-${String(db.payments.length + 1).padStart(4, '0')}`,
    serialNumber: db.payments.length + 1,
    date: paymentReq.date,
    trafficId: paymentReq.trafficId || (traffic ? traffic.id : ''),
    name: paymentReq.trafficName,
    phone: paymentReq.phone,
    package: paymentReq.package,
    paidAmount: paymentReq.paidAmount,
    dueAmount: paymentReq.dueAmount,
    afterMarriageAmount: paymentReq.afterMarriageFee,
    paymentMethod: paymentReq.paymentMethod,
    assignedRole: paymentReq.role || creatorRole,
    assignedBy: paymentReq.assignedBy || creatorName,
    createdBy: creatorName,
    createdRole: creatorRole,
    approvedBy: approver?.name || 'Admin',
    invoiceId: `INV-${paymentReq.trafficId || 'PAY'}-${Date.now().toString().slice(-4)}`,
    images: candidateImages,
    gender: traffic?.gender || paymentReq.gender || '',
    profession: traffic?.profession || '',
  };
  db.payments.push(newPayment);

  saveDB(db);
  res.json({ success: true, payment: newPayment });
});

app.post('/api/payments/requests/:id/reject', authMiddleware, (req, res) => {
  const rejector = (req as any).user;
  if (rejector.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Permission denied: Only Super Admin can reject payment requests.' });
  }

  const { id } = req.params;
  const db = loadDB();

  const reqIndex = db.paymentRequests.findIndex(pr => pr.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Payment request not found' });
  }

  const paymentReq = db.paymentRequests[reqIndex];
  paymentReq.status = 'rejected';
  paymentReq.rejectedBy = rejector?.name || 'Admin';
  paymentReq.rejectedAt = new Date().toISOString();

  // Mark traffic payment status as rejected
  const traffic = db.traffics.find(t => t.id === paymentReq.trafficId);
  if (traffic) {
    traffic.paymentStatus = 'rejected';
  }

  saveDB(db);
  res.json({ success: true, message: 'Payment request rejected' });
});

// Get accepted payments enriched with candidate profile photos & details
app.get('/api/payments', authMiddleware, (req, res) => {
  const db = loadDB();
  const actor = (req as any).user;
  let list = db.payments || [];

  if (actor.role === 'CRO' || actor.role === 'MK') {
    list = list.filter(p => {
      const matched = (db.traffics || []).find(
        t => (p.trafficId && t.id === p.trafficId) ||
             (t.phone && p.phone && t.phone === p.phone) ||
             (t.name && p.name && t.name === p.name)
      );
      const isCreator = p.createdBy === actor.name || p.creatorId === actor.id ||
                        matched?.createdBy === actor.name || matched?.creatorId === actor.id;
      const isAssigned = matched?.assignBy === actor.name || matched?.assignedTo?.name === actor.name || matched?.assignedTo?.id === actor.id;
      return isCreator || isAssigned;
    });
  }

  const enrichedPayments = list.map((p, idx) => {
    const matched = (db.traffics || []).find(
      t => (p.trafficId && t.id === p.trafficId) ||
           (t.phone && p.phone && t.phone === p.phone) ||
           (t.name && p.name && t.name === p.name)
    );
    const creatorName = matched?.createdBy || p.createdBy || 'Sohag';
    const creatorRole = matched?.creatorRole || p.createdRole || 'Super Admin';

    return {
      ...p,
      serialNumber: p.serialNumber || (idx + 1),
      trafficId: p.trafficId || (matched ? matched.id : ''),
      images: (matched?.images && matched.images.length > 0) ? matched.images : (p.images || []),
      gender: matched?.gender || p.gender || '',
      profession: matched?.profession || p.profession || '',
      createdBy: creatorName,
      createdRole: creatorRole,
    };
  });
  res.json(enrichedPayments);
});

// --- PAID TRAFFIC API ---
app.get('/api/paid-traffic', authMiddleware, (req, res) => {
  const db = loadDB();
  const actor = (req as any).user;
  // Only traffic records where payment is accepted and status is not trash
  let paid = (db.traffics || [])
    .filter(t => t.status !== 'trash' && t.paymentStatus === 'accepted');

  if (actor.role === 'CRO') {
    paid = paid.filter(t => {
      if (t.creatorId) return t.creatorId === actor.id;
      return t.createdBy === actor.name;
    });
  } else if (actor.role === 'MK') {
    paid = paid.filter(t => {
      const isCreator = (t.creatorId && t.creatorId === actor.id) || t.createdBy === actor.name;
      const isAssigned = (t.assignedTo?.id && t.assignedTo?.id === actor.id) ||
                         (t.assignedTo?.name && t.assignedTo?.name === actor.name) ||
                         t.assignBy === actor.name ||
                         (Array.isArray(t.assignedMKs) && t.assignedMKs.some((m: any) => m.id === actor.id || m.name === actor.name));
      return isCreator || isAssigned;
    });
  }

  const result = paid.map(t => ({
    ...t,
    createdBy: t.createdBy || 'Sohag',
    creatorRole: t.creatorRole || 'Super Admin',
  }));
  res.json(result);
});

// Change assign for paid traffic (supports single or multiple MK accounts)
app.put('/api/paid-traffic/:id/change-assign', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role === 'CRO' || actor.role === 'MK') {
    return res.status(403).json({ error: 'Permission denied: CRO and MK accounts are not permitted to change assigned account.' });
  }

  const { id } = req.params;
  const { assignedName, role, assignedMKs } = req.body;

  const db = loadDB();
  const traffic = db.traffics.find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  const now = Date.now();

  if (Array.isArray(assignedMKs) && assignedMKs.length > 0) {
    traffic.assignedMKs = assignedMKs.map((m: any) => ({
      id: m.id || '',
      name: m.name || '',
      role: m.role || 'MK',
      assignedAt: now,
    }));
    traffic.assignedTo = {
      id: assignedMKs[0].id || '',
      name: assignedMKs[0].name || '',
      role: assignedMKs[0].role || 'MK',
    };
    traffic.assignBy = assignedMKs.map((m: any) => m.name).join(', ');
    traffic.assignedAt = now;
  } else if (assignedName) {
    traffic.assignedTo = {
      id: req.body.assignedId || '',
      name: assignedName,
      role: role || 'MK',
    };
    traffic.assignedMKs = [{
      id: req.body.assignedId || '',
      name: assignedName,
      role: role || 'MK',
      assignedAt: now,
    }];
    traffic.assignBy = assignedName;
    traffic.assignedAt = now;
  } else {
    return res.status(400).json({ error: 'Assigned accounts are required' });
  }

  saveDB(db);
  res.json({ success: true, traffic });
});

// --- MATCHMAKING SERVICES API ---
// Record matchmaking service action (Incoming Call, Outgoing Call, CV Send, Update)
app.post('/api/matchmaking/:id/service', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  const { id } = req.params;
  const { serviceType, note } = req.body;

  if (!serviceType) {
    return res.status(400).json({ error: 'Service type is required (Incoming Call, Outgoing Call, CV Send, or Update)' });
  }

  const validTypes = ['Incoming Call', 'Outgoing Call', 'CV Send', 'Update'];
  if (!validTypes.includes(serviceType)) {
    return res.status(400).json({ error: `Invalid service type. Must be one of: ${validTypes.join(', ')}` });
  }

  const db = loadDB();
  const traffic = (db.traffics || []).find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Candidate profile not found' });
  }

  if (!Array.isArray(traffic.matchmakingServices)) {
    traffic.matchmakingServices = [];
  }

  const now = Date.now();
  const formattedDate = new Date(now).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const serviceRecord = {
    id: `srv_${now}_${Math.random().toString(36).slice(2, 7)}`,
    serviceType,
    note: note ? String(note).trim() : '',
    timestamp: now,
    isoDate: new Date(now).toISOString(),
    formattedDate,
    providedBy: {
      id: actor.id,
      name: actor.name,
      role: actor.role,
    },
  };

  traffic.matchmakingServices.unshift(serviceRecord);
  traffic.lastServiceAt = now;
  traffic.lastServiceType = serviceType;
  traffic.lastServiceNote = note ? String(note).trim() : '';
  traffic.lastServiceBy = {
    id: actor.id,
    name: actor.name,
    role: actor.role,
  };
  traffic.serviceStatus = 'completed';

  saveDB(db);
  res.json({ success: true, service: serviceRecord, traffic });
});

// Update Candidate Matchmaking Level (MK & Super Admin)
app.put('/api/matchmaking/:id/level', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  const { id } = req.params;
  const { level } = req.body;

  const db = loadDB();
  const traffic = (db.traffics || []).find((t: any) => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Candidate profile not found' });
  }

  const cleanLevel = level ? String(level).trim() : 'Level 1';
  traffic.matchmakingLevel = cleanLevel;
  traffic.levelUpdatedAt = Date.now();
  traffic.levelUpdatedBy = {
    id: actor.id,
    name: actor.name,
    role: actor.role,
  };

  // Also auto-add to global matchmaking levels list if not present
  if (!Array.isArray(db.matchmakingLevels)) {
    db.matchmakingLevels = ['Level 1', 'Level 2', 'Level 3', 'VIP', 'Urgent'];
  }
  if (cleanLevel && !db.matchmakingLevels.includes(cleanLevel)) {
    db.matchmakingLevels.push(cleanLevel);
  }

  saveDB(db);
  res.json({ success: true, level: cleanLevel, traffic, levels: db.matchmakingLevels });
});

// Get configured matchmaking levels
app.get('/api/matchmaking/levels', authMiddleware, (req, res) => {
  const db = loadDB();
  if (!Array.isArray(db.matchmakingLevels) || db.matchmakingLevels.length === 0) {
    db.matchmakingLevels = ['Level 1', 'Level 2', 'Level 3', 'VIP', 'Urgent'];
    saveDB(db);
  }
  res.json({ success: true, levels: db.matchmakingLevels });
});

// Add or update configured matchmaking levels (manual input by MK users)
app.post('/api/matchmaking/levels', authMiddleware, (req, res) => {
  const { level, levels } = req.body;
  const db = loadDB();
  if (!Array.isArray(db.matchmakingLevels)) {
    db.matchmakingLevels = ['Level 1', 'Level 2', 'Level 3', 'VIP', 'Urgent'];
  }

  if (Array.isArray(levels)) {
    db.matchmakingLevels = Array.from(new Set(levels.map((l: string) => String(l).trim()).filter(Boolean)));
  } else if (level && typeof level === 'string') {
    const trimmed = level.trim();
    if (trimmed && !db.matchmakingLevels.includes(trimmed)) {
      db.matchmakingLevels.push(trimmed);
    }
  }

  saveDB(db);
  res.json({ success: true, levels: db.matchmakingLevels });
});

// Delete a custom matchmaking level option
app.delete('/api/matchmaking/levels/:levelName', authMiddleware, (req, res) => {
  const levelName = decodeURIComponent(req.params.levelName);
  const db = loadDB();
  if (Array.isArray(db.matchmakingLevels)) {
    db.matchmakingLevels = db.matchmakingLevels.filter((l: string) => l !== levelName);
    saveDB(db);
  }
  res.json({ success: true, levels: db.matchmakingLevels || [] });
});

// Rename an existing level option and cascade to candidate profiles that have this level
app.put('/api/matchmaking/levels/rename', authMiddleware, (req, res) => {
  const { oldName, newName } = req.body;
  const db = loadDB();
  const cleanOld = oldName ? String(oldName).trim() : '';
  const cleanNew = newName ? String(newName).trim() : '';

  if (!cleanOld || !cleanNew) {
    return res.status(400).json({ error: 'Both oldName and newName are required' });
  }

  if (!Array.isArray(db.matchmakingLevels)) {
    db.matchmakingLevels = ['Level 1', 'Level 2', 'Level 3', 'VIP', 'Urgent'];
  }

  // Rename in level options list
  const idx = db.matchmakingLevels.indexOf(cleanOld);
  if (idx !== -1) {
    db.matchmakingLevels[idx] = cleanNew;
  } else if (!db.matchmakingLevels.includes(cleanNew)) {
    db.matchmakingLevels.push(cleanNew);
  }

  // Cascade to candidate profiles with this level
  (db.traffics || []).forEach((t: any) => {
    if (t.matchmakingLevel === cleanOld) {
      t.matchmakingLevel = cleanNew;
      t.levelUpdatedAt = Date.now();
    }
  });

  saveDB(db);
  res.json({ success: true, levels: db.matchmakingLevels, oldName: cleanOld, newName: cleanNew });
});

// Get matchmaking stats & overdue counts for MK / Super Admin
app.get('/api/matchmaking/stats', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  const db = loadDB();

  let paid = (db.traffics || []).filter(t => t.status !== 'trash' && t.paymentStatus === 'accepted');

  if (actor.role === 'MK') {
    paid = paid.filter(t => {
      const isCreator = (t.creatorId && t.creatorId === actor.id) || t.createdBy === actor.name;
      const isAssigned = (t.assignedTo?.id && t.assignedTo?.id === actor.id) ||
                         (t.assignedTo?.name && t.assignedTo?.name === actor.name) ||
                         t.assignBy === actor.name ||
                         (Array.isArray(t.assignedMKs) && t.assignedMKs.some((m: any) => m.id === actor.id || m.name === actor.name));
      return isCreator || isAssigned;
    });
  }

  const now = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  let serviceRequiredCount = 0;
  let serviceCompletedCount = 0;
  let totalServicesProvidedByMe = 0;
  const myServicedClientIds = new Set<string>();

  paid.forEach(t => {
    const lastServiceTime = t.lastServiceAt || t.assignedAt || t.createdTimestamp || Date.now();
    const isOverdue = (now - lastServiceTime) >= THREE_DAYS_MS;
    if (isOverdue || !t.lastServiceAt) {
      serviceRequiredCount++;
    } else {
      serviceCompletedCount++;
    }

    if (Array.isArray(t.matchmakingServices)) {
      t.matchmakingServices.forEach((s: any) => {
        if (s.providedBy?.id === actor.id || s.providedBy?.name === actor.name) {
          totalServicesProvidedByMe++;
          myServicedClientIds.add(t.id);
        }
      });
    }
  });

  res.json({
    totalAssignedClients: paid.length,
    serviceRequiredCount,
    serviceCompletedCount,
    myTotalServicesCount: totalServicesProvidedByMe,
    myUniqueClientsServicedCount: myServicedClientIds.size,
  });
});

// Remove from Paid Traffic (moves to Trush bin)
app.put('/api/paid-traffic/:id/remove', authMiddleware, (req, res) => {
  const actor = (req as any).user;
  if (actor.role === 'CRO' || actor.role === 'MK') {
    return res.status(403).json({ error: 'Permission denied: CRO and MK accounts are not permitted to delete paid traffic.' });
  }

  const { id } = req.params;
  const db = loadDB();
  const traffic = db.traffics.find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  traffic.status = 'trash';
  traffic.deletedAt = Date.now();
  traffic.trashCategory = 'Paid Traffic';
  traffic.deletedBy = {
    id: actor?.id || 'usr_staff',
    name: actor?.name || 'Staff Member',
    role: actor?.role || 'Super Admin',
  };
  saveDB(db);
  res.json({ success: true, message: 'Removed and moved to Trush bin', traffic });
});

// --- TRASH BIN (TRUSH BIN) API: 10-DAY AUTO-PURGE RETENTION, RESTORE & PERMANENT DELETE ---
const TRASH_RETENTION_MS = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds

// Auto-purge any items in trash that have been deleted for more than 10 days
function purgeExpiredTrash(db: any) {
  const now = Date.now();
  let modified = false;

  // 1. Purge expired leads
  if (Array.isArray(db.leads)) {
    const origLeadsCount = db.leads.length;
    db.leads = db.leads.filter((l: any) => {
      if (l.status === 'trash') {
        const deletedTime = l.deletedAt || (Array.isArray(l.activityLog) ? l.activityLog.find((a: any) => a.newStatus === 'trash')?.timestamp : null) || l.createdTimestamp || now;
        if (now - deletedTime >= TRASH_RETENTION_MS) {
          return false; // permanently purged from database after 10 days
        }
      }
      return true;
    });
    if (db.leads.length !== origLeadsCount) modified = true;
  }

  // 2. Purge expired traffics (both Traffic and Paid Traffic records)
  if (Array.isArray(db.traffics)) {
    const origTrafficsCount = db.traffics.length;
    db.traffics = db.traffics.filter((t: any) => {
      if (t.status === 'trash') {
        const deletedTime = t.deletedAt || t.createdTimestamp || now;
        if (now - deletedTime >= TRASH_RETENTION_MS) {
          return false; // permanently purged from database after 10 days
        }
      }
      return true;
    });
    if (db.traffics.length !== origTrafficsCount) modified = true;
  }

  if (modified) {
    saveDB(db);
  }
}

// 1. Get all trash items with days remaining and categorization (Traffic, Paid Traffic, Lead)
app.get('/api/trash', authMiddleware, (req, res) => {
  const db = loadDB();
  purgeExpiredTrash(db);

  const now = Date.now();
  const trashItems: any[] = [];

  // A. Process Deleted Leads
  (db.leads || []).forEach((lead: any) => {
    if (lead.status === 'trash') {
      const deletedAt = lead.deletedAt || (Array.isArray(lead.activityLog) ? lead.activityLog.find((a: any) => a.newStatus === 'trash')?.timestamp : null) || lead.createdTimestamp || now;
      const expiresAt = deletedAt + TRASH_RETENTION_MS;
      const msRemaining = Math.max(0, expiresAt - now);
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
      const hoursRemaining = Math.ceil(msRemaining / (60 * 60 * 1000));

      const deletedDateObj = new Date(deletedAt);
      const formattedDeletedDate = `${deletedDateObj.getFullYear()}-${String(deletedDateObj.getMonth() + 1).padStart(2, '0')}-${String(deletedDateObj.getDate()).padStart(2, '0')} ${String(deletedDateObj.getHours()).padStart(2, '0')}:${String(deletedDateObj.getMinutes()).padStart(2, '0')}`;

      trashItems.push({
        id: lead.id,
        originalId: lead.id,
        category: 'Lead',
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        gender: lead.gender || '',
        profession: lead.profession || '',
        createdBy: lead.createdBy || 'Sohag',
        creatorRole: lead.creatorRole || 'Super Admin',
        createdAt: lead.createdAt || 'N/A',
        deletedAt,
        deletedDate: formattedDeletedDate,
        deletedBy: lead.deletedBy || { name: 'Staff Member', role: 'Super Admin' },
        expiresAt,
        msRemaining,
        daysRemaining,
        hoursRemaining,
        images: Array.isArray(lead.images) ? lead.images : [],
        rawItem: lead,
      });
    }
  });

  // B. Process Deleted Traffics & Paid Traffics
  (db.traffics || []).forEach((traffic: any) => {
    if (traffic.status === 'trash') {
      const deletedAt = traffic.deletedAt || traffic.createdTimestamp || now;
      const expiresAt = deletedAt + TRASH_RETENTION_MS;
      const msRemaining = Math.max(0, expiresAt - now);
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
      const hoursRemaining = Math.ceil(msRemaining / (60 * 60 * 1000));

      const deletedDateObj = new Date(deletedAt);
      const formattedDeletedDate = `${deletedDateObj.getFullYear()}-${String(deletedDateObj.getMonth() + 1).padStart(2, '0')}-${String(deletedDateObj.getDate()).padStart(2, '0')} ${String(deletedDateObj.getHours()).padStart(2, '0')}:${String(deletedDateObj.getMinutes()).padStart(2, '0')}`;

      // Distinguish category: Paid Traffic if marked or payment accepted, otherwise Traffic
      const category = (traffic.trashCategory === 'Paid Traffic' || traffic.paymentStatus === 'accepted')
        ? 'Paid Traffic'
        : 'Traffic';

      trashItems.push({
        id: traffic.id,
        originalId: traffic.id,
        category,
        name: traffic.name,
        phone: traffic.phone,
        email: traffic.email || '',
        gender: traffic.gender || '',
        profession: traffic.profession || '',
        createdBy: traffic.createdBy || 'Sohag',
        creatorRole: traffic.creatorRole || 'Super Admin',
        createdAt: traffic.createdAt || 'N/A',
        deletedAt,
        deletedDate: formattedDeletedDate,
        deletedBy: traffic.deletedBy || { name: 'Staff Member', role: 'Super Admin' },
        expiresAt,
        msRemaining,
        daysRemaining,
        hoursRemaining,
        package: traffic.package || '',
        images: Array.isArray(traffic.images) ? traffic.images : [],
        rawItem: traffic,
      });
    }
  });

  // Sort by most recently deleted first
  trashItems.sort((a, b) => b.deletedAt - a.deletedAt);

  const counts = {
    total: trashItems.length,
    traffic: trashItems.filter(i => i.category === 'Traffic').length,
    paidTraffic: trashItems.filter(i => i.category === 'Paid Traffic').length,
    lead: trashItems.filter(i => i.category === 'Lead').length,
  };

  res.json({
    items: trashItems,
    counts,
    retentionDays: 10,
  });
});

// 2. Restore an item from Trash Bin back to active pipeline
app.post('/api/trash/restore', authMiddleware, (req, res) => {
  const { id, category } = req.body;
  if (!id || !category) {
    return res.status(400).json({ error: 'Item ID and category are required' });
  }

  const db = loadDB();
  const actor = (req as any).user;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (category === 'Lead') {
    const lead = (db.leads || []).find((l: any) => l.id === id);
    if (!lead) return res.status(404).json({ error: 'Lead not found in trash' });

    lead.status = 'active';
    delete lead.deletedAt;
    delete lead.trashCategory;
    delete lead.deletedBy;

    if (!lead.activityLog || !Array.isArray(lead.activityLog)) {
      lead.activityLog = ensureLeadActivityLog(lead);
    }

    lead.activityLog.unshift({
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      leadId: lead.id,
      type: 'status_change',
      previousStatus: 'trash',
      newStatus: 'active',
      timestamp: Date.now(),
      formattedDate,
      user: {
        id: actor?.id || 'usr_staff',
        name: actor?.name || 'Staff Member',
        role: actor?.role || 'Super Admin',
        phone: actor?.phone || '',
      },
      comment: 'Lead successfully restored from Trash Bin back to active pipeline',
    });

    saveDB(db);
    return res.json({ success: true, message: `Lead ${lead.name} restored to active pipeline.`, item: lead });
  } else {
    // Traffic or Paid Traffic
    const traffic = (db.traffics || []).find((t: any) => t.id === id);
    if (!traffic) return res.status(404).json({ error: 'Traffic record not found in trash' });

    traffic.status = 'active';
    delete traffic.deletedAt;
    delete traffic.trashCategory;
    delete traffic.deletedBy;

    saveDB(db);
    return res.json({ success: true, message: `${category} candidate ${traffic.name} restored to active pipeline.`, item: traffic });
  }
});

// 3. Permanently Delete item (2nd confirmation delete - removes from database forever)
app.delete('/api/trash/permanent', authMiddleware, (req, res) => {
  const { id, category } = req.body;
  if (!id || !category) {
    return res.status(400).json({ error: 'Item ID and category are required' });
  }

  const db = loadDB();

  if (category === 'Lead') {
    const initialCount = (db.leads || []).length;
    db.leads = (db.leads || []).filter((l: any) => l.id !== id);
    if (db.leads.length === initialCount) {
      return res.status(404).json({ error: 'Lead not found for permanent deletion' });
    }
  } else {
    // Traffic or Paid Traffic
    const initialCount = (db.traffics || []).length;
    db.traffics = (db.traffics || []).filter((t: any) => t.id !== id);
    if (db.traffics.length === initialCount) {
      return res.status(404).json({ error: 'Traffic record not found for permanent deletion' });
    }
  }

  saveDB(db);
  res.json({ success: true, message: `Permanently removed ${category} record (${id}) from database.` });
});

// 4. Empty entire Trash Bin (or by specific category) permanently
app.post('/api/trash/empty', authMiddleware, (req, res) => {
  const { category = 'all' } = req.body;
  const db = loadDB();
  let purgedCount = 0;

  if (category === 'all' || category === 'Lead') {
    const before = (db.leads || []).length;
    db.leads = (db.leads || []).filter((l: any) => l.status !== 'trash');
    purgedCount += before - db.leads.length;
  }

  if (category === 'all' || category === 'Traffic' || category === 'Paid Traffic') {
    const before = (db.traffics || []).length;
    if (category === 'all') {
      db.traffics = (db.traffics || []).filter((t: any) => t.status !== 'trash');
    } else if (category === 'Paid Traffic') {
      db.traffics = (db.traffics || []).filter((t: any) => !(t.status === 'trash' && (t.trashCategory === 'Paid Traffic' || t.paymentStatus === 'accepted')));
    } else if (category === 'Traffic') {
      db.traffics = (db.traffics || []).filter((t: any) => !(t.status === 'trash' && (t.trashCategory !== 'Paid Traffic' && t.paymentStatus !== 'accepted')));
    }
    purgedCount += before - db.traffics.length;
  }

  saveDB(db);
  res.json({ success: true, message: `Permanently deleted ${purgedCount} item(s) from database.`, purgedCount });
});

// ============================================================
// SETTINGS & DYNAMIC FIELD SEEDINGS MANAGEMENT
// ============================================================

// 1. Get dynamic field options and agency settings
app.get('/api/settings/fields', (req, res) => {
  const db = loadDB();
  res.json({
    fields: {
      ...DEFAULT_FIELD_SEEDINGS,
      ...(db.customFields || {}),
    },
    agencySettings: db.agencySettings || DEFAULT_AGENCY_SETTINGS,
  });
});

// 2. Update dynamic field options (save customized professions, qualifications, etc.)
app.put('/api/settings/fields', authMiddleware, (req, res) => {
  const { fields } = req.body;
  if (!fields || typeof fields !== 'object') {
    return res.status(400).json({ error: 'Valid fields object is required' });
  }

  const db = loadDB();
  db.customFields = {
    ...DEFAULT_FIELD_SEEDINGS,
    ...(db.customFields || {}),
    ...fields,
  };

  saveDB(db);
  res.json({
    success: true,
    message: 'Field options updated successfully',
    fields: db.customFields,
  });
});

// 3. Reset dynamic fields to default seedings (either single category or all)
app.post('/api/settings/fields/reset', authMiddleware, (req, res) => {
  const { category } = req.body;
  const db = loadDB();

  if (!db.customFields) {
    db.customFields = { ...DEFAULT_FIELD_SEEDINGS };
  }

  if (category && category !== 'all') {
    if (category in DEFAULT_FIELD_SEEDINGS) {
      (db.customFields as any)[category] = [...(DEFAULT_FIELD_SEEDINGS as any)[category]];
    } else {
      return res.status(400).json({ error: `Invalid category: ${category}` });
    }
  } else {
    db.customFields = { ...DEFAULT_FIELD_SEEDINGS };
  }

  saveDB(db);
  res.json({
    success: true,
    message: category && category !== 'all' ? `Reset ${category} to default seedings` : 'Reset all fields to default seedings',
    fields: db.customFields,
  });
});

// 4. Get agency profile settings
app.get('/api/settings/agency', (req, res) => {
  const db = loadDB();
  res.json({
    agencySettings: db.agencySettings || DEFAULT_AGENCY_SETTINGS,
  });
});

// 5. Update agency profile settings
app.put('/api/settings/agency', authMiddleware, (req, res) => {
  const { agencySettings } = req.body;
  if (!agencySettings || typeof agencySettings !== 'object') {
    return res.status(400).json({ error: 'Valid agencySettings object is required' });
  }

  const db = loadDB();
  db.agencySettings = {
    ...DEFAULT_AGENCY_SETTINGS,
    ...(db.agencySettings || {}),
    ...agencySettings,
  };

  saveDB(db);
  res.json({
    success: true,
    message: 'Agency settings updated successfully',
    agencySettings: db.agencySettings,
  });
});

// Setup Attendance Routes (PWA Attendance Scanner & Admin Dashboard)
setupAttendanceRoutes(app, loadDB, saveDB, authMiddleware);

// Setup Daily Report Routes (Auto metrics, CRO/MK submissions, Admin review)
setupDailyReportRoutes(app, loadDB, saveDB, authMiddleware);

// --- START SERVER WITH VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shadikabbo CRM Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
