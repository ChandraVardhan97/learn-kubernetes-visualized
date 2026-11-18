#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f resources.yaml
for attempt in $(seq 1 60); do
  reason=$(k get pod m17-oom -o jsonpath='{.status.containerStatuses[0].state.terminated.reason}')
  [ "$reason" = OOMKilled ] && break
  sleep 1
done
[ "$reason" = OOMKilled ] || { k describe pod m17-oom; echo 'Expected OOMKilled; inspect runtime accounting.' >&2; exit 1; }
k get pod m17-oom -o yaml
kubectl --context kind-kv-lab get nodes
