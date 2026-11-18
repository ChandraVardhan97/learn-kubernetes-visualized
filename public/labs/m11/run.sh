#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f resources.yaml
[ "$(k auth can-i list pods --as=system:serviceaccount:kv-lab:m11-reader)" = yes ]
[ "$(k auth can-i get secrets --as=system:serviceaccount:kv-lab:m11-reader)" = no ]
wait_ready m11
k exec m11 -- id
k get pod m11 -o jsonpath='{.spec.automountServiceAccountToken}{"\n"}'
