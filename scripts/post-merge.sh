#!/usr/bin/env bash
set -euo pipefail

# Always run from the repository root, regardless of the caller's directory.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Restore the committed dependency graph, including build/type-check tools.
# No database imports, migrations, media cleanup, or credential changes here.
npm ci --include=dev --no-audit --no-fund
npm run lint
npm run build
