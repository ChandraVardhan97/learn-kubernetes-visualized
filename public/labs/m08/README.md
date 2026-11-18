# m08: Measure whether this cluster enforces a selected ingress policy

## Requirements
Docker Desktop or Docker Engine running; kind v0.33.0; kubectl v1.37.x; Python 3; named disposable cluster kv-lab and namespace kv-lab. Download every file into one directory, then run bash run.sh. See /labs/kind.yaml and the lab guide for cluster setup.

This exercise changes only the disposable kind-kv-lab context. Each script verifies its cluster and uses an explicit namespace. Do not run with production credentials. No script changes your active context.

## Run
```bash
bash run.sh
```

## Expected observations
Baseline HTTP succeeds. With deny-ingress, a new TCP request fails only when the dataplane enforces NetworkPolicy. An explicit allow rule permits the labeled client again. The script reports unsupported enforcement clearly.

## Inspect if results differ
```bash
kubectl --context kind-kv-lab -n kv-lab get pods -l lab=m08 -o wide
kubectl --context kind-kv-lab -n kv-lab get events --sort-by=.metadata.creationTimestamp
kubectl --context kind-kv-lab -n kv-lab describe pods -l lab=m08
```

## Scope and prerequisites
NetworkPolicy requires an enforcing CNI or policy controller. Older kind configurations did not enforce it; newer kind releases advertise embedded kube-network-policies. Do not infer enforcement from version or object acceptance: this lab measures it. If the default runtime does not enforce, recreate a separate disposable cluster with a supported enforcing implementation before using policy as a security boundary. Ingress/Gateway API controllers and TLS certificates are separate optional add-ons; a policy is not an ingress route.

Application images use explicit version tags (nginx 1.28.0-alpine and BusyBox 1.37.0), not latest. Tags can be republished; production delivery should resolve and record registry digests. The kind node image is digest pinned.

## Cleanup
```bash
bash cleanup.sh
# When ALL labs are finished, destroy only the named disposable cluster:
kind delete cluster --name kv-lab
```
Cleanup removes this module's labeled resources. Some exercises create cluster-scoped CRDs or admission policy: their cleanup explicitly names those disposable resources. PVC cleanup deletes local data. Keep backups outside the cluster before cleanup.
