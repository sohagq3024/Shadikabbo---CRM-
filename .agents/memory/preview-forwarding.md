---
name: Preview forwarding
description: Prevent Vite's separate hot-reload port from replacing the CRM preview port.
---

Use the existing DISABLE_HMR switch for the Express-mounted Vite workflow and keep the CRM port as the only forwarded HTTP entry.

**Why:** Inline Vite settings alone did not prevent the configured hot-reload server from opening a separate port. Automatic port discovery then forwarded the public preview to the WebSocket listener, returning HTTP 426 while the CRM itself was healthy.

**How to apply:** After package/runtime installation, check forwarding and the public API response. If normal HTTPS requests return 426, inspect hot-reload port mappings rather than changing CRM authentication or Neon logic.
