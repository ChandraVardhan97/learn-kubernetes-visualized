#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k delete deployment,replicaset,pod,service,configmap,secret,pvc,statefulset,daemonset,job,cronjob,role,rolebinding,serviceaccount,networkpolicy,resourcequota,limitrange,hpa,pdb,lease -l lab=m20 --ignore-not-found
definition=$(k get crd webapps.labs.kv.example --ignore-not-found -o name)
if [ -n "$definition" ]; then k delete webapp m20-platform --ignore-not-found; fi
# Only after m16 and m20: kubectl --context kind-kv-lab delete crd webapps.labs.kv.example
