#!/usr/bin/env bash
set -euo pipefail

# Initialize / update administrator credentials
python create_admin.py || true

exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
