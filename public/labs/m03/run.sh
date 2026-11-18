#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply -f resources.yaml
uid=$(k get configmap m03 -o jsonpath='{.metadata.uid}')
version_before=$(k get configmap m03 -o jsonpath='{.metadata.resourceVersion}')
annotation_value=$(python3 -c 'import uuid;print("metadata-"+uuid.uuid4().hex)')
k annotate configmap m03 "experiment=$annotation_value" --overwrite
version_after=$(k get configmap m03 -o jsonpath='{.metadata.resourceVersion}')
[ "$version_after" != "$version_before" ]
[ "$(k get configmap m03 -o jsonpath='{.metadata.annotations.experiment}')" = "$annotation_value" ]
printf 'resourceVersion changed: %s -> %s (no arithmetic implied)\n' "$version_before" "$version_after"
k apply -f resources.yaml
[ "$(k get configmap m03 -o jsonpath='{.metadata.uid}')" = "$uid" ]
k get configmaps -l lab=m03 -o yaml
kubectl config current-context
