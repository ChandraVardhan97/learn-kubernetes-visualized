#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f resources.yaml
uid=$(k get configmap m15 -o jsonpath='{.metadata.uid}')
for attempt in 1 2 3; do k apply -f resources.yaml; done
[ "$(k get configmap m15 -o jsonpath='{.metadata.uid}')" = "$uid" ]
k get lease m15 -o yaml
kubectl --context kind-kv-lab -n kube-system get leases
k get configmap m15 -w --request-timeout=3s || true
