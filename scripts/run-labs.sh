#!/usr/bin/env bash
# Execute exact published commands against a task-owned cluster and private kubeconfig.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/.runtime/bin:$PWD/.runtime/node_modules/node/bin:$PATH"
export KIND_EXPERIMENTAL_PROVIDER=docker
for tool in python3 node docker; do
  command -v "$tool" >/dev/null || { echo "Missing dependency: $tool" >&2; exit 2; }
done

mode=${1:-smoke}
bundle=${2:-public/labs/kv-labs.zip}
[[ -f "$bundle" ]] || { echo "Bundle not found: $bundle" >&2; exit 2; }
clusters() {
  local found
  found=$(docker ps -a --filter label=io.x-k8s.kind.cluster --format '{{.Label "io.x-k8s.kind.cluster"}}') || return
  printf '%s\n' "$found" | sort -u
}
existing=$(clusters)
if printf '%s\n' "$existing" | grep -Eq '^kv-(lab|recovery)$'; then
  echo 'The integration run needs the reserved kv-lab and kv-recovery names. Existing clusters will be preserved.' >&2
  exit 2
fi
for container in kv-lab-m01-process kv-recovery-etcd-tool; do
  if docker container inspect "$container" >/dev/null 2>&1; then
    echo "The integration run needs the reserved container name $container." >&2
    exit 2
  fi
done

umask 077
export KV_TEST_ROOT
KV_TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/kv-lab-check.XXXXXX")
KV_TEST_ROOT=$(cd "$KV_TEST_ROOT" && pwd -P)
export KV_TEST_BUNDLE="$KV_TEST_ROOT/downloads"
original_kubectl=$(command -v kubectl || true)
before=
if [[ -n "$original_kubectl" ]]; then before=$("$original_kubectl" config current-context 2>/dev/null || true); fi
original_kubeconfig=${KUBECONFIG-}

export KUBECONFIG="$KV_TEST_BUNDLE/.kv-lab/kubeconfig"
export PATH="$KV_TEST_BUNDLE/.kv-lab/bin:$PATH"
cleanup() {
  local status=$? cleanup_failed=0 after
  trap - EXIT
  set +e
  if [ -f "$KV_TEST_ROOT/backups/m18/recovery.kubeconfig" ]; then
    KV_LAB_BACKUP_DIR="$KV_TEST_ROOT/backups/m18" bash "$KV_TEST_BUNDLE/m18/cleanup-recovery.sh" || cleanup_failed=1
  fi
  if [ -s "$KUBECONFIG" ]; then kind delete cluster --name kv-lab --kubeconfig "$KUBECONFIG" || cleanup_failed=1; fi
  after=$(clusters) || cleanup_failed=1
  [ "$after" = "$existing" ] || cleanup_failed=1
  after=
  if [[ -n "$original_kubectl" ]]; then after=$(KUBECONFIG="$original_kubeconfig" "$original_kubectl" config current-context 2>/dev/null || true); fi
  [ "$after" = "$before" ] || cleanup_failed=1
  if [ "$cleanup_failed" = 0 ]; then rm -rf -- "$KV_TEST_ROOT" || cleanup_failed=1; fi
  if [ "$cleanup_failed" = 0 ]; then
    echo 'PASS disposable cluster and private output cleanup; original kubectl context preserved'
  else
    echo "FAIL disposable cluster or private output cleanup. Inspect the private run directory: $KV_TEST_ROOT" >&2
    status=1
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
python3 -m zipfile -e "$bundle" "$KV_TEST_BUNDLE"
mkdir "$KV_TEST_ROOT/backups"
(cd "$KV_TEST_BUNDLE" && bash setup.sh)
source "$KV_TEST_BUNDLE/lab-env.sh"
k() { kubectl --context kind-kv-lab "$@"; }
node --import tsx scripts/run-lab-steps.ts "$mode"
if [ "$mode" = all ]; then
  # Server dry-run needs two admission prerequisites owned by this cluster.
  k -n kv-lab create serviceaccount m11-reader
  node --import tsx scripts/validate-labs.ts --server
  k -n kv-lab delete serviceaccount m11-reader --timeout=60s
  k delete crd webapps.labs.kv.example --timeout=120s
fi
