#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k get storageclass
k apply -f resources.yaml
wait_ready m09
k exec m09 -- sh -c 'echo survives-pod-replacement > /data/proof.txt'
claim=$(k get pvc m09 -o jsonpath='{.spec.volumeName}')
k delete pod m09 --wait=true
k apply -f consumer.yaml
wait_ready m09
[ "$(k exec m09 -- cat /data/proof.txt)" = survives-pod-replacement ]
[ "$(k get pvc m09 -o jsonpath='{.spec.volumeName}')" = "$claim" ]
k get pvc m09
