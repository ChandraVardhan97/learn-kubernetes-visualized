#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k delete deployment,replicaset,pod,service,configmap,secret,pvc,statefulset,daemonset,job,cronjob,role,rolebinding,serviceaccount,networkpolicy,resourcequota,limitrange,hpa,pdb,lease -l lab=p04 --ignore-not-found
namespace=kv-lab-p04-target
marker=$(k get namespace "$namespace" --ignore-not-found -o jsonpath='{.metadata.labels.lab}')
if [ "$marker" = p04 ]; then k delete namespace "$namespace" --timeout=120s; fi
