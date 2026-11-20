#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k delete deployment,replicaset,pod,service,configmap,secret,pvc,statefulset,daemonset,job,cronjob,role,rolebinding,serviceaccount,networkpolicy,resourcequota,limitrange,hpa,pdb,lease -l lab=p02 --ignore-not-found
node=kv-lab-worker
marker=$(k get node "$node" -o jsonpath='{.metadata.annotations.labs\.kv\.example/p02}')
if [ "$marker" = owned-by-p02 ]; then
  taint=$(k get node "$node" -o 'jsonpath={.spec.taints[?(@.key=="labs.kv.example/p02")].value}')
  if [ -n "$taint" ]; then
    [ "$taint" = reserved ] || { echo 'Teaching taint changed; refusing to remove it.' >&2; exit 1; }
    k taint node "$node" labs.kv.example/p02:NoSchedule-
  fi
  k annotate node "$node" labs.kv.example/p02-
fi
