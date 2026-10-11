---
name: Dependency advisory interpretation
description: Official patched SheetJS CDN releases can still receive stale all-version npm vulnerability matches.
---

Do not replace a trusted patched upstream library merely to make a scanner turn green. Compare the installed release with the advisory's descriptive affected range and the publisher's authoritative distribution channel; disclose any remaining scanner alerts.

**Why:** OSV matching reported two high SheetJS alerts even for official CDN release 0.20.3. The GitHub advisory descriptions explicitly identify fixes in 0.19.3 and 0.20.2, while the stale npm registry has no patched release.

**How to apply:** For SheetJS, use the official CDN, not an unverified republisher. Recheck upstream advisories when versions change. This finding does not justify blanket suppression or treating all scanner disagreements as false positives.
