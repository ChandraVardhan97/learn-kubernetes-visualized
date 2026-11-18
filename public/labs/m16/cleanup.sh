#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k delete deployment,replicaset,pod,service,configmap,secret,pvc,statefulset,daemonset,job,cronjob,role,rolebinding,serviceaccount,networkpolicy,resourcequota,limitrange,hpa,pdb,lease -l lab=m16 --ignore-not-found
k delete webapp m16 --ignore-not-found
# Optional after m20 is also finished: kubectl --context kind-kv-lab delete crd webapps.labs.kv.example
