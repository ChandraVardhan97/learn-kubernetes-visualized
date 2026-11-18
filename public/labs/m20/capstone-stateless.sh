#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f stateless.yaml
k rollout status deployment/m20-web --timeout=180s
wait_ready m20-client
# Investigation: healthy Pods, wrong selector, no usable Service endpoints.
k get pods -l lab=m20 -o wide
k get service m20-web -o yaml
k get endpointslices -l kubernetes.io/service-name=m20-web -o yaml
if k exec m20-client -- wget -qO- -T 3 http://m20-web >/dev/null 2>&1; then
  echo 'Broken selector unexpectedly served traffic' >&2; exit 1
fi
k patch service m20-web --type merge -p '{"spec":{"selector":{"app":"m20-web"}}}'
for attempt in $(seq 1 30); do
  if k exec m20-client -- wget -qO- -T 3 http://m20-web >/dev/null 2>&1; then
    echo 'Recovered stateless request path'; exit 0
  fi
  sleep 1
done
echo 'Service recovery timed out' >&2; exit 1
