#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f resources.yaml
wait_ready m07-allowed
for attempt in $(seq 1 30); do
  reason=$(k get pod m07-pending -o 'jsonpath={.status.conditions[?(@.type=="PodScheduled")].reason}')
  [ "$reason" = Unschedulable ] && break
  sleep 1
done
[ "$reason" = Unschedulable ]
[ "$(k get pod m07-pending -o jsonpath='{.status.phase}')" = Pending ]
k describe pod m07-pending
k get pod m07-allowed -o jsonpath='{.status.qosClass}{"\n"}'
