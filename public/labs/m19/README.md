# m19: Reconcile declared configuration and identify delivery boundaries

## Requirements
Docker Desktop or Docker Engine running; kind v0.33.0; kubectl v1.37.x; Python 3; named disposable cluster kv-lab and namespace kv-lab. Download every file into one directory, then run bash run.sh. See /labs/kind.yaml and the lab guide for cluster setup.

This exercise changes only the disposable kind-kv-lab context. Each script verifies its cluster and uses an explicit namespace. Do not run with production credentials. No script changes your active context.

## Run
```bash
bash run.sh
```

## Expected observations
The declared ConfigMap is applied by a GitOps field manager. Manual drift changes the live value. Reapplying the declaration restores it; managedFields show ownership. No Argo CD runtime is implied by this local replay.

## Inspect if results differ
```bash
kubectl --context kind-kv-lab -n kv-lab get pods -l lab=m19 -o wide
kubectl --context kind-kv-lab -n kv-lab get events --sort-by=.metadata.creationTimestamp
kubectl --context kind-kv-lab -n kv-lab describe pods -l lab=m19
```

## Scope and prerequisites
This is an explicit manual reconciliation replay, not a continuously running GitOps controller. Argo CD is optional and adds a repo server, API server, application controller, Redis and other components; allocate additional Docker CPU/RAM. A digest identifies bytes but does not by itself verify signatures or attestations. Service mesh and multi-tenant policy enforcement need separately installed controllers and trust configuration.

Application images use explicit version tags (nginx 1.28.0-alpine and BusyBox 1.37.0), not latest. Tags can be republished; production delivery should resolve and record registry digests. The kind node image is digest pinned.

## Cleanup
```bash
bash cleanup.sh
# When ALL labs are finished, destroy only the named disposable cluster:
kind delete cluster --name kv-lab
```
Cleanup removes this module's labeled resources. Some exercises create cluster-scoped CRDs or admission policy: their cleanup explicitly names those disposable resources. PVC cleanup deletes local data. Keep backups outside the cluster before cleanup.
