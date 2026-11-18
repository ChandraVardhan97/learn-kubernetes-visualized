# m16: Run a schema-validated API and an idempotent reconciler

## Requirements
Docker Desktop or Docker Engine running; kind v0.33.0; kubectl v1.37.x; Python 3; named disposable cluster kv-lab and namespace kv-lab. Download every file into one directory, then run bash run.sh. See /labs/kind.yaml and the lab guide for cluster setup.

This exercise changes only the disposable kind-kv-lab context. Each script verifies its cluster and uses an explicit namespace. Do not run with production credentials. No script changes your active context.

## Run
```bash
bash run.sh
```

## Expected observations
The WebApp creates an owned ConfigMap and Deployment. Repeated reconciliation keeps the Deployment UID; deletion of an owned ConfigMap is repaired. A replica change in the custom resource converges to two ready Pods.

## Inspect if results differ
```bash
kubectl --context kind-kv-lab -n kv-lab get pods -l lab=m16 -o wide
kubectl --context kind-kv-lab -n kv-lab get events --sort-by=.metadata.creationTimestamp
kubectl --context kind-kv-lab -n kv-lab describe pods -l lab=m16
```

## Scope and prerequisites
The Python process uses your disposable-cluster credentials and polls; it is a real controller but not a production operator. It owns only generated objects and refuses to adopt an unowned collision. Owner references drive garbage collection after deleting the WebApp. No conversion webhook, leader election or finalizer is implemented. The shared WebApp CRD is used by m20; delete it only after both labs.

Application images use explicit version tags (nginx 1.28.0-alpine and BusyBox 1.37.0), not latest. Tags can be republished; production delivery should resolve and record registry digests. The kind node image is digest pinned.

## Cleanup
```bash
bash cleanup.sh
# When ALL labs are finished, destroy only the named disposable cluster:
kind delete cluster --name kv-lab
```
Cleanup removes this module's labeled resources. Some exercises create cluster-scoped CRDs or admission policy: their cleanup explicitly names those disposable resources. PVC cleanup deletes local data. Keep backups outside the cluster before cleanup.
