#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"

bash release-hold.sh
k delete deployment,replicaset,pod,service,configmap,secret,pvc,statefulset,daemonset,job,cronjob,role,rolebinding,serviceaccount,networkpolicy,resourcequota,limitrange,hpa,pdb,lease -l lab=m14 --ignore-not-found --timeout=90s
