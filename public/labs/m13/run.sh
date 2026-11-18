#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k kustomize .
k apply -k .
k rollout status deployment/m13 --timeout=180s
k get hpa m13
if kubectl --context kind-kv-lab get --raw /apis/metrics.k8s.io/v1beta1/nodes >/dev/null 2>&1; then
  k top pods -l app=m13
else
  echo 'Metrics Server is absent: HPA scaling is not demonstrated; inspect conditions, then install a compatible Metrics Server to continue.'
fi
k describe hpa m13
