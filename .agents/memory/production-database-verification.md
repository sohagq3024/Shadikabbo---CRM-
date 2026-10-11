---
name: Production CRM database approval
description: Publishing must not silently connect the owner to another Neon CRM or import stale local records.
---

Keep the approved CRM identity stable. If a publishing configuration points to a different database, fix the production connection setting rather than changing the approval to match an unknown CRM.

**Why:** The owner was unsure whether production used the existing external Neon CRM. Secret-existence metadata cannot prove the target of Publishing's separate connection secret, and there was no live deployment to query.

**How to apply:** Preserve database identity in full backups and legitimate restores. Never bypass the production identity check to make a publish succeed. Only the actual deployment startup can verify Publishing's configured target.
