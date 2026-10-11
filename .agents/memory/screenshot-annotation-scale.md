---
name: Screenshot annotation scale
description: Avoid misplaced guidance arrows when annotating uploaded screenshots.
---

Image previews returned by the file viewer may be smaller than the original image. Never use the displayed preview's pixel coordinates directly on the original.

**Why:** A large editor screenshot appeared as a smaller preview, causing guidance markers to miss their intended controls.

**How to apply:** Inspect the original dimensions first, or explicitly resize a working copy to the coordinate system used for annotations. View the finished image before delivering it.
