#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_PATH="$(cd "$SCRIPT_DIR/.." && pwd)"
NEXUS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKSPACE_ROOT="$(cd "$NEXUS_ROOT/.." && pwd)"

PROBE_OUT="${PROBE_OUT:-$WORKSPACE_ROOT/probe/src/module_bindings}"
FRONTEND_OUT="${FRONTEND_OUT:-$NEXUS_ROOT/frontend/src/spacetime/generated}"

DB_NAME="${STDB_DB_NAME:-nexus}"
SEED_UI=0
PROBE_WALLET=""
PROBE_BIN="${PROBE_BIN:-probe}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed-ui)
      SEED_UI=1
      shift
      ;;
    --db)
      DB_NAME="$2"
      shift 2
      ;;
    --probe-wallet)
      PROBE_WALLET="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: ./generate.sh [--seed-ui] [--db <database-name>] [--probe-wallet <wallet>]"
      echo
      echo "Options:"
      echo "  --seed-ui           Call seed_ui_data reducer after generating bindings"
      echo "  --db <name>         Database name for seeding (default: nexus or STDB_DB_NAME)"
      echo "  --probe-wallet      Log spacetime CLI in using token from this probe wallet"
      echo
      echo "Notes:"
      echo "  - --probe-wallet updates current spacetime CLI login identity."
      echo "  - Override output paths with PROBE_OUT and FRONTEND_OUT if needed."
      echo "  - Override probe binary with PROBE_BIN if needed."
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run ./generate.sh --help for usage."
      exit 1
      ;;
  esac
done

if [[ -n "$PROBE_WALLET" ]]; then
  echo "Syncing spacetime CLI login from probe wallet '$PROBE_WALLET'..."
  if ! command -v "$PROBE_BIN" >/dev/null 2>&1; then
    echo "Probe binary not found: $PROBE_BIN"
    exit 1
  fi

  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required to parse probe JSON output for --probe-wallet."
    exit 1
  fi

  TOKEN_JSON="$($PROBE_BIN token "$PROBE_WALLET" --json)"
  TOKEN="$(printf '%s' "$TOKEN_JSON" | node -e "const fs=require('fs');const input=fs.readFileSync(0,'utf8');const data=JSON.parse(input);process.stdout.write(data?.data?.token||'');")"

  if [[ -z "$TOKEN" ]]; then
    echo "Failed to read token for wallet '$PROBE_WALLET'."
    echo "Run: $PROBE_BIN auth $PROBE_WALLET <address> --save"
    exit 1
  fi

  spacetime login --token "$TOKEN" >/dev/null
fi

echo "Generating TypeScript bindings..."

echo "  → probe: $PROBE_OUT"
spacetime generate --lang typescript --out-dir "$PROBE_OUT" --module-path "$MODULE_PATH" -y

echo "  → frontend: $FRONTEND_OUT"
spacetime generate --lang typescript --out-dir "$FRONTEND_OUT" --module-path "$MODULE_PATH" -y

if [[ "$SEED_UI" -eq 1 ]]; then
  echo "Seeding UI data into database '$DB_NAME'..."
  spacetime call "$DB_NAME" seed_ui_data
fi

echo "Done."
