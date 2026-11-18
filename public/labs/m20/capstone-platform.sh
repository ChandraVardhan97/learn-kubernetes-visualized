#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
command -v python3 >/dev/null || { echo 'Python 3 required' >&2; exit 2; }
k apply -f crd.yaml
k wait --for=condition=Established crd/webapps.labs.kv.example --timeout=60s
# GitOps owns the custom resource spec; the operator owns generated objects.
k apply --server-side --field-manager=kv-gitops -f platform.yaml
python3 operator.py --iterations 2 --interval 1
k rollout status deployment/m20-platform --timeout=180s
if k apply --server-side --field-manager=kv-human -f platform-conflict.yaml; then
  echo 'Expected custom resource spec ownership conflict' >&2; exit 1
fi
k get webapp m20-platform -o yaml --show-managed-fields
k get deployment m20-platform -o yaml --show-managed-fields
uid=$(k get deployment m20-platform -o jsonpath='{.metadata.uid}')
python3 operator.py --iterations 3 --interval 1
[ "$(k get deployment m20-platform -o jsonpath='{.metadata.uid}')" = "$uid" ]
k delete configmap m20-platform
python3 operator.py --once
[ "$(k get configmap m20-platform -o jsonpath='{.data.index\.html}')" = gitops-declared-page ]
k delete webapp m20-platform --wait=true
k wait --for=delete deployment/m20-platform --timeout=90s
k wait --for=delete configmap/m20-platform --timeout=90s
echo 'Separate field ownership, repeated reconciliation, repair, and garbage collection verified.'
