#!/usr/bin/env bash
set -euo pipefail
for tool in kubectl kind python3; do command -v "$tool" >/dev/null || { echo "Missing dependency: $tool" >&2; exit 2; }; done
client_version=$(kubectl version --client -o json | python3 -c 'import json,sys; print(json.load(sys.stdin)["clientVersion"]["gitVersion"])')
if [[ ! "$client_version" =~ ^v1\.37\.[0-9]+([+-].*)?$ ]]; then
  echo "Refusing: kubectl v1.37.x is required for the pinned v1.37 cluster; found $client_version." >&2
  exit 2
fi
CONTEXT=kind-kv-lab
NAMESPACE=kv-lab
cluster=$(kubectl config view -o 'jsonpath={.contexts[?(@.name=="kind-kv-lab")].context.cluster}')
[ "$cluster" = kind-kv-lab ] || { echo 'Refusing: context kind-kv-lab must address cluster kind-kv-lab.' >&2; exit 2; }
kind get clusters | grep -qx kv-lab || { echo 'Refusing: disposable kind cluster kv-lab is absent.' >&2; exit 2; }
k() { kubectl --context "$CONTEXT" --namespace "$NAMESPACE" "$@"; }
# No use-context or set-context: the caller's active context is never changed.
actual=$(kubectl --context "$CONTEXT" get nodes -o 'jsonpath={range .items[*]}{.metadata.name}{"\n"}{end}' | sort)
expected=$(kind get nodes --name kv-lab | sort)
[ "$actual" = "$expected" ] || { echo 'Refusing: API nodes differ from named kind cluster.' >&2; exit 2; }
k create namespace "$NAMESPACE" --dry-run=client -o yaml | k apply -f - >/dev/null
# The service-account controller creates this asynchronously after namespace creation.
k wait --for=create serviceaccount/default --timeout=90s >/dev/null
cd "$(dirname "$0")"
wait_ready() { k wait --for=condition=Ready "pod/$1" --timeout=180s; }
