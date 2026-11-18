#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f resources.yaml
k rollout status deployment/m02 --timeout=180s
old=$(k get pods -l app=m02 -o jsonpath='{.items[0].metadata.name}')
uid=$(k get pod "$old" -o jsonpath='{.metadata.uid}')
k get pod "$old" -o jsonpath='{.metadata.ownerReferences[0].kind}{"/"}{.metadata.ownerReferences[0].name}{"\n"}'
k delete pod "$old" --wait=true
k rollout status deployment/m02 --timeout=180s
k wait --for=condition=Ready pod -l app=m02 --timeout=180s
! k get pods -l app=m02 -o jsonpath='{.items[*].metadata.uid}' | grep -q "$uid"
[ "$(k get deployment m02 -o jsonpath='{.status.readyReplicas}')" = 2 ]
k get deployment,replicaset,pods -l lab=m02
