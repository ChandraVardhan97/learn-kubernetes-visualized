#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
command -v docker >/dev/null || { echo 'Docker CLI required' >&2; exit 2; }
docker run --rm --name kv-lab-m01-process busybox:1.37.0 sh -c 'hostname; id; echo process-complete'
k apply -f resources.yaml
wait_ready m01
k get pod m01 -o wide
k exec m01 -- wget -qO- http://127.0.0.1:80 | head -n 3
