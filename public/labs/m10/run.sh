#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f resources.yaml
k rollout status statefulset/m10 --timeout=180s
k wait --for=condition=complete job/m10-job --timeout=180s
k logs job/m10-job
k get statefulset,daemonset,job,cronjob,pdb -l lab=m10
k get pods -l lab=m10 -o wide
