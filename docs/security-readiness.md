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

## Before and after publishing

Before publishing, run type checking, the test suite, build, scans, production-mode startup, and private API/media checks. Keep backups of both Neon records and media bytes; no deployment or storage service guarantees zero future loss.

After the owner clicks Publish, check the actual deployment status and URL, database identity validation, signed-in owner/staff flows, private media downloads, and the configured custom domain. An anonymous screenshot verifies the login screen only, not signed-in CRM screens.
