# m18: Capture an etcd snapshot and rehearse offline restoration separately

## Requirements
Docker Desktop or Docker Engine running; kind v0.33.0; kubectl v1.37.x; Python 3; named disposable cluster kv-lab and namespace kv-lab. Download every file into one directory, then run bash run.sh. See /labs/kind.yaml and the lab guide for cluster setup.

This exercise changes only the disposable kind-kv-lab context. Each script verifies its cluster and uses an explicit namespace. Do not run with production credentials. No script changes your active context.

## Run
```bash
bash run.sh
```

## Expected observations
The snapshot command writes a consistent etcd snapshot to kv-lab.db in the private directory printed by the script, outside the cluster and published assets. The optional restore script creates only kv-recovery, stops its API/etcd, restores into a fresh data directory with a revision bump, and checks the saved marker.

## Inspect if results differ
```bash
kubectl --context kind-kv-lab -n kv-lab get pods -l lab=m18 -o wide
kubectl --context kind-kv-lab -n kv-lab get events --sort-by=.metadata.creationTimestamp
kubectl --context kind-kv-lab -n kv-lab describe pods -l lab=m18
```

## Scope and prerequisites
A one-control-plane kind cluster cannot prove HA, quorum resilience, failure-domain isolation or production recovery RTO/RPO. Snapshot restore rewinds all API data; it does not restore external volumes or cloud resources. Revision bump and compaction invalidate stale watch caches. The offline rehearsal is optional and must be verified on the exact etcd image; preserve source-cluster PKI and encryption configuration in a real recovery plan. Snapshot files contain Secrets.

Application images use explicit version tags (nginx 1.28.0-alpine and BusyBox 1.37.0), not latest. Tags can be republished; production delivery should resolve and record registry digests. The kind node image is digest pinned.

## Private runtime outputs
Runtime outputs default to a private user-specific OS temporary directory, outside the extracted lab and the checkout: run `python3 backup-path.py m18` to print the exact selected location. Replace m18 with this lab's ID. Both capture and recovery use the same default. Set `KV_LAB_BACKUP_DIR` to an explicit private directory to override it; preserve that value for later recovery. The helper requires an owned directory with mode 0700, rejects artifact symlinks, and resolves paths before refusing any destination under this checkout's public/ or dist/ directories. Temporary storage can be cleared by the OS: copy wanted backups to a durable private destination before relying on them.

```bash
backup_dir=$(python3 backup-path.py m18)
printf 'Selected private output directory: %s\n' "$backup_dir"
```

## Cleanup
```bash
bash cleanup.sh
# When ALL labs are finished, destroy only the named disposable cluster:
kind delete cluster --name kv-lab
```
Cleanup removes this module's labeled resources. Some exercises create cluster-scoped CRDs or admission policy: their cleanup explicitly names those disposable resources. PVC cleanup deletes local data. Keep backups outside the cluster before cleanup.
