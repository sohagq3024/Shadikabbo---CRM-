---
name: Neon pooled connections
description: A Neon pooler limitation affecting schema isolation and PostgreSQL client configuration.
---

Do not pass `search_path` through PostgreSQL startup `options` when using a Neon pooled connection.

**Why:** Neon rejects this startup parameter with an unsupported-parameter error, even though ordinary SQL and direct connections work.

**How to apply:** Fully qualify table names for schema-isolated tests and migrations. Avoid assuming that PostgreSQL session/startup configuration supported by a direct connection also works through the Neon pooler.
