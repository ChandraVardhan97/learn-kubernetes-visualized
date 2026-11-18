#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
k apply --server-side --field-manager=kv-gitops -f resources.yaml
k patch configmap m19 --type merge -p '{"data":{"release":"manual-drift"}}'
[ "$(k get configmap m19 -o jsonpath='{.data.release}')" = manual-drift ]
# kubectl patch may transfer field ownership; explicit force here models an approved declarative takeover.
k apply --server-side --field-manager=kv-gitops --force-conflicts -f resources.yaml
[ "$(k get configmap m19 -o jsonpath='{.data.release}')" = git-declared ]
k get configmap m19 -o yaml --show-managed-fields
