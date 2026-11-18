#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply --server-side --field-manager=kv-gitops -f resources.yaml
if k apply --server-side --field-manager=kv-human -f conflict.yaml; then
  echo 'Expected an SSA conflict but apply succeeded' >&2; exit 1
fi
k get configmap m14 -o yaml --show-managed-fields
k patch configmap m14 --type merge -p '{"metadata":{"finalizers":["labs.kv.example/hold"]}}'
k delete configmap m14 --wait=false
[ -n "$(k get configmap m14 -o jsonpath='{.metadata.deletionTimestamp}')" ]
k patch configmap m14 --type merge -p '{"metadata":{"finalizers":[]}}'
k wait --for=delete configmap/m14 --timeout=30s
