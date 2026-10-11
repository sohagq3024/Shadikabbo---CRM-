# Shadikabbo CRM

## Run
- Keep the existing React/Vite frontend and Express/TypeScript backend.
- Install dependencies from package.json. Use `npm run dev` for development.
- The server listens on `PORT` (defaults to 3000). The Replit verification workflow uses `PORT=5000 npm run dev`.
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
