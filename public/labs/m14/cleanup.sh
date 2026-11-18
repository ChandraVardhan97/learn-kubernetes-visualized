#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
if k get configmap m14 >/dev/null 2>&1; then k patch configmap m14 --type merge -p '{"metadata":{"finalizers":[]}}'; fi
k delete deployment,replicaset,pod,service,configmap,secret,pvc,statefulset,daemonset,job,cronjob,role,rolebinding,serviceaccount,networkpolicy,resourcequota,limitrange,hpa,pdb,lease -l lab=m14 --ignore-not-found
