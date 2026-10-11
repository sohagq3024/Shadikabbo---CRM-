---
name: Media ownership safety
description: Why default-bucket cleanup requires upload provenance, not filename patterns
---

Automatically delete only files demonstrably uploaded by this CRM, after checking all current/trash references and an unused grace period. Unknown bucket objects must remain untouched even if their names look like this application's UUIDs.

**Why:** The user explicitly prioritizes preventing future data loss. A default bucket can be reused/shared, and a UUID filename alone cannot prove application ownership.

**How to apply:** When adding uploads or migrations, persist their ownership evidence with the committed CRM update. Failed/uncommitted uploads may be cleaned using the exact upload list from that operation; never discover deletion candidates by filename resemblance alone.
