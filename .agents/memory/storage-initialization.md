---
name: Object Storage initialization
description: Missing default buckets can reject SDK initialization before an eventual readiness check.
---

Construct the Replit Object Storage client only inside an immediately awaited, caught operation.

**Why:** The SDK starts asynchronous initialization in its constructor. When the default bucket was absent, constructing the client at module scope caused an unhandled rejection while Neon startup work was running, before a later readiness check could handle it.

**How to apply:** Keep initialization lazy. An unavailable bucket must produce an explicit upload error without crashing the CRM or destroying existing inline files. Restart after the user provisions the default bucket.
