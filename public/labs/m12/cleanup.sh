#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k delete deployment,replicaset,pod,service,configmap,secret,pvc,statefulset,daemonset,job,cronjob,role,rolebinding,serviceaccount,networkpolicy,resourcequota,limitrange,hpa,pdb,lease -l lab=m12 --ignore-not-found
