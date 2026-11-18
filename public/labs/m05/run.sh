#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f resources.yaml
k rollout status deployment/m05 --timeout=180s
p=$(k get pods -l app=m05 -o jsonpath='{.items[0].metadata.name}')
k exec "$p" -- rm /tmp/ready
k wait --for=condition=Ready=false pod/"$p" --timeout=60s
for attempt in $(seq 1 30); do
  state=$(k get endpointslices -l kubernetes.io/service-name=m05 -o json | python3 -c 'import json,sys; p=sys.argv[1]; es=[e for s in json.load(sys.stdin)["items"] for e in (s.get("endpoints") or []) if e.get("targetRef",{}).get("name")==p]; print("usable" if any(e.get("conditions",{}).get("ready",True) for e in es) else "not-ready")' "$p")
  [ "$state" = not-ready ] && break
  sleep 1
done
[ "$state" = not-ready ]
k get endpointslices -l kubernetes.io/service-name=m05 -o yaml
k exec "$p" -- touch /tmp/ready
k wait --for=condition=Ready pod/"$p" --timeout=60s
k patch deployment m05 --type merge -p '{"spec":{"template":{"metadata":{"annotations":{"release":"two"}}}}}'
k rollout status deployment/m05 --timeout=180s
k rollout undo deployment/m05
k rollout status deployment/m05 --timeout=180s
