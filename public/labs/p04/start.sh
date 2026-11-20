#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"

namespace=kv-lab-p04-target
[ -z "$(k get namespace "$namespace" --ignore-not-found -o name)" ] || { echo "Target teaching namespace already exists." >&2; exit 2; }
k create namespace "$namespace" --dry-run=client -o yaml |
  k label --local -f - lab=p04 -o yaml |
  k create -f -
kubectl --context "$CONTEXT" -n "$namespace" create configmap p04-status --from-literal=environment=teaching
k apply -f resources.yaml
