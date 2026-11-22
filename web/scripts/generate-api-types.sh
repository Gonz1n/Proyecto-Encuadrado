#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."
schema="$(mktemp -t openapi).json"
(cd ../api && uv run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))") > "$schema"
pnpm exec openapi-typescript "$schema" -o src/types/api.ts
rm -f "$schema"
