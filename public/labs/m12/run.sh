#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
http_result() {
  k exec m12-client -- sh -c 'if wget -qO- -T 2 http://m12 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi'
}
wait_http() {
  local expected="$1"
  for attempt in $(seq 1 45); do
    [ "$(http_result)" = "$expected" ] && return 0
    sleep 1
  done
  echo "Timed out waiting for m12 response: $expected" >&2; return 1
}
k apply -f resources.yaml
k rollout status deployment/m12 --timeout=180s
wait_ready m12-client
# Wait for the deliberate process failure's actual diagnostic, not a fixed startup delay.
crash_logs=''
for attempt in $(seq 1 45); do
  crash_logs=$(k logs m12-crash 2>/dev/null) || true
  [[ "$crash_logs" = *'fatal: missing required config'* ]] && break
  sleep 1
done
[[ "$crash_logs" = *'fatal: missing required config'* ]] || { echo 'Expected failure log was not observed' >&2; exit 1; }
printf '%s\n' "$crash_logs"
k describe pod m12-crash
wait_http HTTP_FAILED
k get endpointslices -l kubernetes.io/service-name=m12 -o yaml
k patch service m12 --type merge -p '{"spec":{"selector":{"app":"m12"}}}'
wait_http HTTP_OK
k logs m12-crash --previous || true
echo 'Deliberate process-failure log, failed Service request and repaired HTTP request observed.'
