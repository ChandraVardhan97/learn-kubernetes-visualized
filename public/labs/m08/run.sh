#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
http_result() {
  k exec m08-client -- sh -c 'if wget -qO- -T 2 http://m08 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi'
}
wait_http() {
  local expected="$1"
  for attempt in $(seq 1 30); do
    [ "$(http_result)" = "$expected" ] && return 0
    sleep 1
  done
  return 1
}
k apply -f resources.yaml
k rollout status deployment/m08 --timeout=180s
wait_ready m08-client
# Remove only this module's policies so a repeated run starts at the same baseline.
k delete -f allow.yaml -f deny.yaml --ignore-not-found
wait_http HTTP_OK || { echo 'Baseline HTTP failed; diagnose the workload before interpreting policy behavior.' >&2; exit 1; }
k apply -f deny.yaml
if ! wait_http HTTP_FAILED; then
  echo 'NO DENIAL OBSERVED within the deadline. Inspect policy selection and the enforcing CNI; object acceptance alone does not establish isolation.' >&2
  k delete -f deny.yaml --ignore-not-found
  exit 3
fi
echo 'Deny-policy stage: a failed new HTTP request was observed after a working baseline.'
k apply -f allow.yaml
wait_http HTTP_OK || { echo 'Allowed-client HTTP did not recover; inspect policies, endpoints and dataplane.' >&2; exit 1; }
echo 'Allow-policy stage: labeled-client HTTP success recovered. This bounded sequence does not test every traffic path.'
