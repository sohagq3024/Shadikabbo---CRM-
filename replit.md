# Shadikabbo CRM

## Run
- Keep the existing React/Vite frontend and Express/TypeScript backend.
- Install dependencies from package.json. Use `npm run dev` for development.
- The server listens on `PORT` (defaults to 3000). The Replit workflow uses `DISABLE_HMR=true PORT=5000 npm run dev`, with only port 5000 forwarded to external port 80. This prevents Vite's separate WebSocket port from taking over the public preview URL.
- Build the frontend with `npm run build`; run production with `NODE_ENV=production npm start`.

## External Neon database only
- Store the Neon pooled PostgreSQL connection URL in the server-side secret `NEON_DATABASE_URL`.
- Do not use Replit's built-in database or `DATABASE_URL` for this project.
- TLS certificate verification is required. Credentials never go into frontend environment variables.
- All runtime CRM reads and writes (including login sessions, attendance, reports, settings, and records) use external Neon.
- An empty Neon database gets a `shadikabbo_crm_store` table and a one-time import of the existing `data/crm_store.json`. Existing Neon records are never overwritten at startup.
- The JSON file is retained as the original import source only; it is never updated and is not a runtime fallback. Once Neon has records, the app can run without it.
- Existing record structure is preserved inside a PostgreSQL JSONB row to minimize changes to the imported application.
- API middleware loads a request-local snapshot under a row lock. `saveDB` marks it for persistence; the transaction commits before the HTTP response is sent. Errors roll back rather than report a successful save.
- API responses must remain buffered (`json`/`send`/`end`). Do not stream or flush headers inside this transaction middleware.
- A missing connection, invalid import, or unavailable database fails explicitly; the app never silently creates an empty local database.
- The single-row lock intentionally serializes CRM requests. For larger traffic volumes, plan a separate normalized-table migration rather than removing the lock.

## Real records and demo cleanup
- Do not add fake accounts, sample clients, or silent mock data to the live application.
- A one-time startup migration removes only the confirmed default placeholder staff accounts and the imported client fixtures combining reserved example-domain emails with invalid nine-byte PDF stubs. Their sessions and related demo attendance/payment records are removed too.
- Preserve Super Admin, unmarked leads, customer documents, payment history, serial counters, and legitimate records. Newly created real staff accounts are not purged on subsequent startups.
- Do not classify a record as demo merely because the base64 encoding contains words such as `test` or `demo`.
- The original import file is archival, not runtime storage; the cleanup also runs after a fresh import so sample records do not reappear.

## Private Replit App Storage
- `@replit/object-storage` uses this Replit app's default private App Storage bucket. Replit's App Storage panel must provision that bucket before files can be uploaded; no invented bucket IDs or access keys.
- CRM images, account photos, and PDF bytes are uploaded to App Storage; Neon stores only private file references and metadata.
- Existing form upload/preview/download flows retain their shape. Authenticated API calls establish a media-only HttpOnly cookie, and `/media/` validates the current Neon session/account before returning file bytes.
- Media downloads do not hold the CRM row lock. Invalid sessions, deleted accounts, and suspended accounts cannot read private files.
- Enforce 15MB images and 25MB PDFs with server-side content signatures, strict object-key validation, and no HTML/SVG serving.
- When storage is available at startup, legacy inline files are externalized in a Neon transaction. An upload or migration failure never silently stores new base64 files in Neon.
- If the default bucket is missing, existing records/files are retained and new file uploads return a clear 503. App Storage bucket creation belongs to the Replit Tools > App Storage panel. Settings > Backup & Restore exposes live readiness checks and a retryable migration action, so the user can finish provisioning without source edits or a workflow restart.
- API responses are private URLs, never session tokens in query parameters or public bucket URLs.

## Data safety and honest browser behavior
- Settings values are updated only from a successful, confirmed server response. Failed saves must not become a local optimistic success. Configuration restore applies fields and agency settings in one Neon transaction; only Super Admin may change them.
- Offline attendance is a temporary device queue, not a cloud save. Blocked/corrupted local storage must not be overwritten or acknowledged as saved. Only explicit server-acknowledged scan IDs are marked synced.
- CRM/API and private media requests are network-only in the PWA. Old unpartitioned attendance/staff-list browser caches are purged; browser preferences/auth session state are not the CRM database.
- Imported password hashes upgrade transparently to salted scrypt after a valid login; existing account credentials are unchanged.
- Super Admin can download a complete, private CRM JSON backup with media bytes included and session tokens omitted. Missing customer files or oversized exports fail explicitly instead of generating a partial success. Backups contain private records and must be stored securely.
- Known unused CRM files get a 24-hour grace period and small hourly cleanup batches. References across every collection, including payments and trash, protect shared documents. Writers reject resurrection of unavailable old references. The ownership safety constraint is documented in `.agents/memory/media-ownership.md`.
- Do not promise zero future data loss. Provider outages, accidental account deletion, device loss before offline sync, and backup retention must be handled openly.
