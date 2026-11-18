#!/usr/bin/env bash
# Integration suite: never creates a cluster or changes the active context.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/.runtime/bin:$PATH"
for tool in kubectl kind python3; do command -v "$tool" >/dev/null || { echo "Missing dependency: $tool" >&2; exit 2; }; done
[ "${1:-smoke}" = smoke ] || [ "$1" = all ] || { echo 'Usage: bash scripts/run-labs.sh [smoke|all]' >&2; exit 2; }
mode=${1:-smoke}
# The smoke set covers actual control loops, readiness/endpoints, placement,
# persistence, authorization, idempotent operator behavior and all capstones.
selected='m02 m05 m06 m07 m09 m11 m16 m20'
[ "$mode" = all ] && selected='m01 m02 m03 m04 m05 m06 m07 m08 m09 m10 m11 m12 m13 m14 m15 m16 m17 m18 m19 m20'
failed=''
backup_root=$(mktemp -d "${TMPDIR:-/tmp}/kv-lab-check.XXXXXX")
echo "Runtime backups: $backup_root"
for id in $selected; do
  echo "=== $id: integration ==="
  if KV_LAB_BACKUP_DIR="$backup_root/$id" bash "public/labs/$id/run.sh"; then
    echo "PASS $id"
  else
    failed="$failed $id"
    echo "FAIL $id" >&2
  fi
  # Keep the namespace; remove only resources owned by the selected module.
  bash "public/labs/$id/cleanup.sh"
done
if [ -n "$failed" ]; then echo "Failed labs:$failed" >&2; exit 1; fi
echo "PASS integration mode=$mode. Optional offline recovery and optional Argo CD were not executed by this script."
