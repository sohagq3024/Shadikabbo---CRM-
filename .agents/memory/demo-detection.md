---
name: Safe demo detection
description: Avoid false positives when cleaning imported CRM fixtures containing encoded media.
---

Do not detect demo records by searching base64 strings for words such as `test` or `demo`.

**Why:** In an imported CRM audit, a valid customer PDF's base64 text contained those words even though the decoded document was not a sample. Deleting the row would have removed linked payment history.

**How to apply:** Identify fixtures using explicit, structured sample indicators and inspect the actual file when uncertain. Preserve unmarked customer data and retain real records created under former placeholder staff accounts.
