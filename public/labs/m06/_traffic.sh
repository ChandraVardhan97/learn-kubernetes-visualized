#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"

ready_count() {
  k get endpointslices -l kubernetes.io/service-name=m06 -o json |
    python3 -c 'import json,sys; print(sum(1 for s in json.load(sys.stdin)["items"] for e in (s.get("endpoints") or []) if e.get("conditions",{}).get("ready") is not False))'
}

wait_traffic() {
  local expectation="$1" result count
  for attempt in $(seq 1 45); do
    # Fail immediately if kubectl or exec itself fails. Only wget determines the HTTP verdict.
    result=$(k exec m06-client -- sh -c 'if wget -qO- -T 2 http://m06 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || return 1
    count=$(ready_count) || return 1
    if [ "$expectation" = HTTP_OK ] && [ "$result" = HTTP_OK ] && [ "$count" -gt 0 ]; then return 0; fi
    if [ "$expectation" = HTTP_FAILED ] && [ "$result" = HTTP_FAILED ] && [ "$count" -eq 0 ]; then return 0; fi
    sleep 1
  done
  printf 'Expected %s, saw %s with %s ready endpoints.\n' "$expectation" "$result" "$count" >&2
  return 1
}
