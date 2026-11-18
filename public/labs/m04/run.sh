#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f resources.yaml
wait_ready m04
k logs m04 -c prepare
k logs m04 -c app
k logs m04 -c companion --tail=2
k exec m04 -c companion -- cat /work/ready
