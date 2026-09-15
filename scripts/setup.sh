#!/usr/bin/env bash
# Full local setup: deps, .env, Postgres, Prisma, seed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing '$1'. Install it and retry." >&2
    exit 1
  fi
}

env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" .env | tail -n 1 || true)"
  line="${line#*=}"
  line="${line%\"}"
  line="${line#\"}"
  printf '%s' "$line"
}

upsert_env() {
  local key="$1"
  local value="$2"
  python3 - "$key" "$value" <<'PY'
from pathlib import Path
import re
import sys

key, value = sys.argv[1], sys.argv[2]
path = Path(".env")
text = path.read_text() if path.exists() else ""
line = f'{key}="{value}"'
pattern = re.compile(rf"^{re.escape(key)}=.*$", re.M)
if pattern.search(text):
    text = pattern.sub(line, text, count=1)
else:
    if text and not text.endswith("\n"):
        text += "\n"
    text += line + "\n"
path.write_text(text)
PY
}

START_DEV=0
VERIFY=0
for arg in "$@"; do
  case "$arg" in
    --dev) START_DEV=1 ;;
    --verify) VERIFY=1 ;;
    -h | --help)
      echo "Usage: $0 [--dev] [--verify]"
      echo "  --dev      start npm run dev when setup finishes"
      echo "  --verify   run lint, typecheck, and tests"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (try --help)" >&2
      exit 1
      ;;
  esac
done

need npm
need docker
need python3
need openssl
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is required." >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop (or the daemon) and retry." >&2
  exit 1
fi

echo "==> npm install"
npm install

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "==> created .env from .env.example"
fi

if [[ -z "$(env_value AUTH_SECRET)" ]]; then
  upsert_env AUTH_SECRET "$(openssl rand -base64 32)"
  echo "==> wrote AUTH_SECRET"
fi

if [[ -z "$(env_value ADMIN_EMAIL)" ]]; then
  upsert_env ADMIN_EMAIL "admin@localhost"
  echo "==> set ADMIN_EMAIL=admin@localhost"
fi

if [[ -z "$(env_value ADMIN_PASSWORD)" ]]; then
  upsert_env ADMIN_PASSWORD "changeme"
  echo "==> set ADMIN_PASSWORD=changeme  (change this in .env, then re-run npm run db:seed)"
fi

echo "==> docker compose up"
docker compose up -d --wait

echo "==> prisma generate / migrate / seed"
npm run db:generate
npm run db:migrate:deploy
npm run db:seed

if [[ "$VERIFY" -eq 1 ]]; then
  echo "==> lint / typecheck / test"
  npm run lint
  npm run typecheck
  npm test
fi

echo
echo "Setup complete."
echo "  Site   http://localhost:3000"
echo "  Admin  http://localhost:3000/admin/login"
echo "  Login  $(env_value ADMIN_EMAIL)"
echo
echo "S3/R2 env vars are optional until you upload new Work photos."

if [[ "$START_DEV" -eq 1 ]]; then
  echo "==> npm run dev"
  exec npm run dev
fi

echo "Start the app with: npm run dev"
