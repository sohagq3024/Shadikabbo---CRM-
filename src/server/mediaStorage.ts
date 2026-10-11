import { Client } from '@replit/object-storage';
import { createHash, randomUUID } from 'node:crypto';
import type { RequestHandler, Request, Response } from 'express';

const PREFIX = 'replit-media:';
const FILE_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|gif|webp|pdf)$/;
const TYPES: Record<string, string> = {
  jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf',
};
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'application/pdf': 'pdf',
};
const FILE_FIELDS = new Set(['images', 'profilePicture', 'dataUrl']);
type StorageClient = Pick<Client, 'uploadFromBytes' | 'downloadAsBytes' | 'delete' | 'list'>;

function hasMediaPayload(value: any, fileField = false): boolean {
  if (typeof value === 'string') return fileField && (value.startsWith('data:') || !!mediaKey(value));
  if (Array.isArray(value)) return value.some(item => hasMediaPayload(item, fileField));
  if (value && typeof value === 'object') return Object.entries(value).some(([key, item]) => hasMediaPayload(item, FILE_FIELDS.has(key)));
  return false;
}

export class MediaError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export function decodeMedia(value: string): { bytes: Buffer; extension: string } {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(value);
  if (!match || !EXTENSIONS[match[1]]) throw new MediaError('Only JPEG, PNG, GIF, WebP and PDF uploads are supported.');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.toString('base64') !== match[2]) throw new MediaError('Invalid file encoding.');
  const extension = EXTENSIONS[match[1]];
  const max = (extension === 'pdf' ? 25 : 15) * 1024 * 1024;
  if (bytes.length > max) throw new MediaError(`File exceeds the ${extension === 'pdf' ? 25 : 15}MB limit.`, 413);
  const valid =
    (extension === 'jpg' && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) ||
    (extension === 'png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (extension === 'gif' && /^(GIF87a|GIF89a)$/.test(bytes.subarray(0, 6).toString('ascii'))) ||
    (extension === 'webp' && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') ||
    (extension === 'pdf' && bytes.subarray(0, 5).toString('ascii') === '%PDF-' &&
      bytes.length > 32 && bytes.subarray(-1024).toString('latin1').includes('%%EOF'));
  if (!valid) throw new MediaError('The uploaded file content does not match its declared format.');
  return { bytes, extension };
}

export function mediaKey(value: string): string | null {
  const key = value.startsWith(PREFIX) ? value.slice(PREFIX.length) :
    value.startsWith('/media/') ? value.slice('/media/'.length) : null;
  return key && FILE_KEY.test(key) ? key : null;
}

export function mediaResponse(value: any): any {
  if (typeof value === 'string') {
    const key = mediaKey(value);
    return key ? `/media/${key}` : value;
  }
  if (Array.isArray(value)) return value.map(mediaResponse);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mediaResponse(item)]));
  return value;
}

export function mediaCookie(res: Response, token?: string): void {
  const tls = process.env.NODE_ENV === 'production' || String(res.req.headers['x-forwarded-proto'] || '').split(',')[0] === 'https';
  // Partitioned cookies support the proxied Replit preview iframe. This cookie
  // grants only immutable file reads, not API mutations.
  const policy = tls ? '; SameSite=None; Secure; Partitioned' : '; SameSite=Lax';
  res.append('Set-Cookie', `shadikabbo_media=${token || ''}; Path=/media; HttpOnly; Max-Age=${token ? 2592000 : 0}${policy}`);
}

export function mediaSession(req: Request): string | null {
  const bearer = req.headers.authorization;
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7);
  return req.headers.cookie?.split(';').map(value => value.trim())
    .find(value => value.startsWith('shadikabbo_media='))?.slice('shadikabbo_media='.length) || null;
}

export class MediaStorage {
  private storageClient?: StorageClient;
  constructor(client?: StorageClient) { this.storageClient = client; }

  private get client(): StorageClient {
    // The SDK starts asynchronous initialization in its constructor. Construct
    // it only inside an immediately-awaited operation, so a missing bucket's
    // initialization rejection cannot crash Node before ready() catches it.
    return this.storageClient ??= new Client();
  }

  async ready(): Promise<boolean> {
    try { return (await this.client.list({ maxResults: 1 })).ok; } catch { return false; }
  }

  async externalize(value: any, uploaded: string[] = [], depth = 0, fileField = false, shared = new Map<string, string>()): Promise<{ value: any; count: number }> {
    if (depth > 50) throw new MediaError('File request is nested too deeply.');
    if (typeof value === 'string') {
      if (!fileField) return { value, count: 0 };
      const existing = mediaKey(value);
      if (existing) return { value: PREFIX + existing, count: 0 };
      if (!value.startsWith('data:')) return { value, count: 0 };
      const { bytes, extension } = decodeMedia(value);
      const fingerprint = extension + ':' + createHash('sha256').update(bytes).digest('hex');
      const prior = shared.get(fingerprint);
      if (prior) return { value: PREFIX + prior, count: 0 };
      const key = `${randomUUID()}.${extension}`;
      try {
        const result = await this.client.uploadFromBytes(key, bytes, { compress: false });
        if (!result.ok) throw new Error('Upload failed');
      } catch {
        throw new MediaError('Replit App Storage is unavailable. Create its default bucket and retry. The file was not saved.', 503);
      }
      uploaded.push(key);
      shared.set(fingerprint, key);
      return { value: PREFIX + key, count: 1 };
    }
    if (Array.isArray(value)) {
      const items = [];
      let count = 0;
      for (const item of value) {
        const result = await this.externalize(item, uploaded, depth + 1, fileField, shared);
        items.push(result.value);
        count += result.count;
      }
      return { value: items, count };
    }
    if (value && typeof value === 'object') {
      const object: Record<string, any> = {};
      let count = 0;
      for (const [key, item] of Object.entries(value)) {
        const result = await this.externalize(item, uploaded, depth + 1, FILE_FIELDS.has(key), shared);
        object[key] = result.value;
        count += result.count;
      }
      return { value: object, count };
    }
    return { value, count: 0 };
  }

  async cleanup(keys: string[]): Promise<void> {
    for (const key of keys) {
      try {
        const result = await this.client.delete(key, { ignoreNotFound: true });
        if (!result.ok) console.error('An uncommitted media upload could not be removed.');
      } catch { console.error('An uncommitted media upload could not be removed.'); }
    }
  }

  middleware(isAuthenticated: (req: Request) => boolean | Promise<boolean>): RequestHandler {
    return async (req, res, next) => {
      const json = res.json.bind(res);
      res.json = ((value: any) => json(mediaResponse(value))) as typeof res.json;
      let authenticated: boolean;
      try { authenticated = await isAuthenticated(req); }
      catch { return void res.status(503).json({ error: 'Unable to verify the session. No file was saved.' }); }
      if (authenticated && req.headers.authorization?.startsWith('Bearer ')) {
        mediaCookie(res, req.headers.authorization.slice(7));
      }
      if (!req.body || !['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
      if (!hasMediaPayload(req.body)) return next();
      if (!authenticated) return void res.status(401).json({ error: 'Sign in before uploading files.' });
      const uploaded: string[] = [];
      try {
        const result = await this.externalize(req.body, uploaded);
        req.body = result.value;
        res.once('finish', () => { if (res.statusCode >= 400) void this.cleanup(uploaded); });
        next();
      } catch (error) {
        await this.cleanup(uploaded);
        const failure = error instanceof MediaError ? error : new MediaError('Unable to upload the file.', 503);
        res.status(failure.status).json({ error: failure.message });
      }
    };
  }

  download: RequestHandler = async (req, res) => {
    const key = String(req.params.objectName || '');
    if (!FILE_KEY.test(key)) return void res.status(404).json({ error: 'File not found.' });
    try {
      const result = await this.client.downloadAsBytes(key);
      if (!result.ok) {
        res.status(result.error.statusCode === 404 ? 404 : 503).json({ error: 'File is unavailable.' });
        return;
      }
      const extension = key.split('.').pop()!;
      res.set({
        'Content-Type': TYPES[extension],
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `${extension === 'pdf' ? 'attachment' : 'inline'}; filename="${key}"`,
      });
      res.send(result.value[0]);
    } catch { res.status(503).json({ error: 'Replit App Storage is unavailable.' }); }
  };
}
