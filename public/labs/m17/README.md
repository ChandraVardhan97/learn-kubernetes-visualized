# m17: Distinguish a container memory limit from node pressure

## Requirements
Docker Desktop or Docker Engine running; kind v0.33.0; kubectl v1.37.x; Python 3; named disposable cluster kv-lab and namespace kv-lab. Download every file into one directory, then run bash run.sh. See /labs/kind.yaml and the lab guide for cluster setup.

This exercise changes only the disposable kind-kv-lab context. Each script verifies its cluster and uses an explicit namespace. Do not run with production credentials. No script changes your active context.

## Run
```bash
bash run.sh
```

## Expected observations
The bounded process writes to a memory-backed volume until its 16Mi container limit is exceeded; the container terminates with reason OOMKilled. Other Pods remain schedulable.

## Inspect if results differ
```bash
kubectl --context kind-kv-lab -n kv-lab get pods -l lab=m17 -o wide
kubectl --context kind-kv-lab -n kv-lab get events --sort-by=.metadata.creationTimestamp
kubectl --context kind-kv-lab -n kv-lab describe pods -l lab=m17
```

## Scope and prerequisites
This bounded test consumes at most a small container limit; it deliberately avoids exhausting Docker Desktop or a node. OOMKilled is not an eviction. CPU limits throttle; the presence of a CPU limit alone does not measure throttling. Metrics and a load experiment are required for capacity decisions.

Application images use explicit version tags (nginx 1.28.0-alpine and BusyBox 1.37.0), not latest. Tags can be republished; production delivery should resolve and record registry digests. The kind node image is digest pinned.

## Cleanup
```bash
bash cleanup.sh
# When ALL labs are finished, destroy only the named disposable cluster:
kind delete cluster --name kv-lab
```
Cleanup removes this module's labeled resources. Some exercises create cluster-scoped CRDs or admission policy: their cleanup explicitly names those disposable resources. PVC cleanup deletes local data. Keep backups outside the cluster before cleanup.
