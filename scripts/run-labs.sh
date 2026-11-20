#!/usr/bin/env bash
# Execute exact published commands against a task-owned cluster and private kubeconfig.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/.runtime/bin:$PWD/.runtime/node_modules/node/bin:$PATH"
export KIND_EXPERIMENTAL_PROVIDER=docker
for tool in kubectl kind python3 node docker unzip; do
  command -v "$tool" >/dev/null || { echo "Missing dependency: $tool" >&2; exit 2; }
done

mode=${1:-smoke}
existing=$(kind get clusters 2>/dev/null)
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
export KV_TEST_BUNDLE="$KV_TEST_ROOT/downloads"
before=$(kubectl config current-context 2>/dev/null || true)
original_kubeconfig=${KUBECONFIG-}

export KUBECONFIG="$KV_TEST_ROOT/lab.kubeconfig"
owns_lab=0
cleanup() {
  local status=$? cleanup_failed=0 after
  trap - EXIT
  set +e
  if [ -f "$KV_TEST_ROOT/backups/m18/recovery.kubeconfig" ]; then
    KV_LAB_BACKUP_DIR="$KV_TEST_ROOT/backups/m18" bash "$KV_TEST_BUNDLE/m18/cleanup-recovery.sh" || cleanup_failed=1
  fi
  if [ "$owns_lab" = 1 ]; then kind delete cluster --name kv-lab || cleanup_failed=1; fi
  after=$(kind get clusters 2>/dev/null) || cleanup_failed=1
  [ "$after" = "$existing" ] || cleanup_failed=1
  rm -rf -- "$KV_TEST_ROOT" || cleanup_failed=1
  after=$(KUBECONFIG="$original_kubeconfig" kubectl config current-context 2>/dev/null || true)
  [ "$after" = "$before" ] || cleanup_failed=1
  if [ "$cleanup_failed" = 0 ]; then
    echo 'PASS disposable cluster and private output cleanup; original kubectl context preserved'
  else
    echo 'FAIL disposable cluster or private output cleanup' >&2
    status=1
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
unzip -q public/labs/kv-labs.zip -d "$KV_TEST_BUNDLE"
mkdir "$KV_TEST_ROOT/backups"
owns_lab=1
kind create cluster --name kv-lab --config "$KV_TEST_BUNDLE/kind.yaml" --wait 180s
k() { kubectl --context kind-kv-lab "$@"; }
k wait --for=condition=Ready nodes --all --timeout=180s
k -n kube-system rollout status deployment/coredns --timeout=180s
node --import tsx scripts/run-lab-steps.ts "$mode"
if [ "$mode" = all ]; then
  # Server dry-run needs two admission prerequisites owned by this cluster.
  k -n kv-lab create serviceaccount m11-reader
  node --import tsx scripts/validate-labs.ts --server
  k -n kv-lab delete serviceaccount m11-reader --timeout=60s
  k delete crd webapps.labs.kv.example --timeout=120s
fi
