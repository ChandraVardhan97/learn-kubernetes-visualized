#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
command -v python3 >/dev/null || { echo 'Python 3 required' >&2; exit 2; }
k apply -f crd.yaml
k wait --for=condition=Established crd/webapps.labs.kv.example --timeout=60s
# Confirm the API rejects a missing required spec without persisting an object.
if k apply --dry-run=server --validate=false -f - <<'YAML'
apiVersion: labs.kv.example/v1alpha1
kind: WebApp
metadata:
  name: m16-invalid
  namespace: kv-lab
YAML
then
  echo 'Expected the WebApp schema to reject a missing spec' >&2
  exit 1
fi
k apply -f resources.yaml
python3 webapp-reconciler.py --once
k rollout status deployment/m16 --timeout=180s
uid=$(k get deployment m16 -o jsonpath='{.metadata.uid}')
generation=$(k get deployment m16 -o jsonpath='{.metadata.generation}')
python3 webapp-reconciler.py --iterations 3 --interval 1
[ "$(k get deployment m16 -o jsonpath='{.metadata.uid}')" = "$uid" ]
[ "$(k get deployment m16 -o jsonpath='{.metadata.generation}')" = "$generation" ]
[ "$(k get deployment m16 -o jsonpath='{.metadata.ownerReferences[0].uid}')" = "$(k get webapp m16 -o jsonpath='{.metadata.uid}')" ]
k delete configmap m16
python3 webapp-reconciler.py --once
k get configmap m16
k patch webapp m16 --type merge -p '{"spec":{"replicas":2}}'
python3 webapp-reconciler.py --iterations 2 --interval 1
k rollout status deployment/m16 --timeout=180s
[ "$(k get deployment m16 -o jsonpath='{.status.readyReplicas}')" = 2 ]
python3 webapp-reconciler.py --once
k get webapp m16 -o yaml
