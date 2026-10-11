# Public CRM security checks

## Production database

Production startup requires `CRM_INSTANCE_ID` to match the identity held by the approved Neon CRM. The production environment has been configured with the current development CRM's identity.

If Publishing uses a different `NEON_DATABASE_URL`, startup must fail rather than display another CRM or import stale local records. Correct the production secret; do not change the approved identity just to bypass the check. A legitimate full restore must preserve the CRM identity.

Local-file imports are forbidden in production. Verifying a production-mode local process does not verify Publishing's separate secret or the eventual live deployment.

## Authentication

- Login counters are shared in Neon, independent of rejected CRM transactions: 10 attempts per account in 15 minutes and 120 total attempts per minute.
- Counters store a SHA-256 digest, not a submitted phone number.
- Sessions expire after seven days, consistently for API and private media access.
- Authentication bodies are limited to 8 KiB. Sensitive API/media responses must not be cached.
- The owner's existing password was not read, changed, or reset. Before making the CRM public, the owner must replace any imported/default password with a strong, unique password through the authenticated account-management UI.

## SheetJS scanner alerts

The npm-registry `xlsx` release is stale. This project uses SheetJS's official CDN release, 0.20.3, with lockfile integrity verification, without changing the export API.

The scanner can still report both advisories for 0.20.3 because its matching data has no fixed npm-registry version. Do not silently suppress the findings. Review the upstream descriptions:

- [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6): affected versions are below 0.19.3. The advisory also explicitly states that export-only workflows are unaffected.
- [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9): affected versions are below 0.20.2.
- [Official distribution instructions](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/): SheetJS identifies its CDN, not the stale npm package, as the authoritative source.

These two alerts were verified as version-matching false positives for the installed official 0.20.3 release. Re-evaluate this conclusion when versions or advisory descriptions change; it is not a general scanner exemption.

## UUID and esbuild dependency fixes

- UUID is overridden to 11.1.1 for the cloud-storage dependency tree. This is the patched CommonJS-compatible release for [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq); UUID 12.0.0 and 13.0.0 are also affected and must not be selected during future upgrades.
- esbuild is locked at 0.28.2 with a minimum declared version of 0.28.2. [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) affects 0.27.3 through 0.28.0 and is fixed in 0.28.1.
- `npm test` includes dependency regression checks for every locked copy, spreadsheet round-trip fidelity, UUID output-buffer bounds, and TypeScript transformation. Keep the official SheetJS source and lockfile integrity rather than suppressing scanner findings.

## Before and after publishing

Before publishing, run type checking, the test suite, build, scans, production-mode startup, and private API/media checks. Keep backups of both Neon records and media bytes; no deployment or storage service guarantees zero future loss.

After the owner clicks Publish, check the actual deployment status and URL, database identity validation, signed-in owner/staff flows, private media downloads, and the configured custom domain. An anonymous screenshot verifies the login screen only, not signed-in CRM screens.
