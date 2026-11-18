#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
ready_count() {
  k get endpointslices -l kubernetes.io/service-name=m06 -o json |
    python3 -c 'import json,sys;print(sum(1 for s in json.load(sys.stdin)["items"] for e in (s.get("endpoints") or []) if e.get("conditions",{}).get("ready") is not False))'
}
http_result() {
  # A kubectl/exec failure aborts; a failed HTTP request is reported separately.
  k exec m06-client -- sh -c 'if wget -qO- -T 2 http://m06 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi'
}
wait_http() {
  local expected="$1"
  for attempt in $(seq 1 45); do
    [ "$(http_result)" = "$expected" ] && return 0
    sleep 1
  done
  echo "Timed out waiting for m06 response: $expected" >&2; return 1
}
k apply -f resources.yaml
k rollout status deployment/m06 --timeout=180s
wait_ready m06-client
k exec m06-client -- nslookup m06.kv-lab.svc.cluster.local
wait_http HTTP_OK
k patch service m06 --type merge -p '{"spec":{"selector":{"app":"no-match"}}}'
for attempt in $(seq 1 45); do
  [ "$(ready_count)" = 0 ] && break
  sleep 1
done
[ "$(ready_count)" = 0 ] || { echo 'Expected no ready Service backends' >&2; exit 1; }
wait_http HTTP_FAILED
echo 'Wrong selector: zero ready endpoints and failed new HTTP request observed.'
k get endpointslices -l kubernetes.io/service-name=m06 -o yaml
k patch service m06 --type merge -p '{"spec":{"selector":{"app":"m06"}}}'
wait_http HTTP_OK
[ "$(ready_count)" -gt 0 ]
k get service m06 -o wide
echo 'Selector restored: ready backends and HTTP success observed.'
