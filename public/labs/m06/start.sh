#!/usr/bin/env bash
source "$(dirname "$0")/_traffic.sh"

k apply -f resources.yaml
k rollout status deployment/m06 --timeout=180s
wait_ready m06-client
k exec m06-client -- nslookup m06.kv-lab.svc.cluster.local
wait_traffic HTTP_OK
k patch service m06 --type merge -p '{"spec":{"selector":{"app":"no-match"}}}'
wait_traffic HTTP_FAILED
echo 'Starting state verified: the selector matches no ready endpoints and new HTTP fails.'
