# m20: Complete stateless diagnosis, file recovery, and GitOps/operator capstones

## Requirements
Docker Desktop or Docker Engine running; kind v0.33.0; kubectl v1.37.x; Python 3; named disposable cluster kv-lab and namespace kv-lab. Download every file into one directory, then run bash run.sh. See /labs/kind.yaml and the lab guide for cluster setup.

This exercise changes only the disposable kind-kv-lab context. Each script verifies its cluster and uses an explicit namespace. Do not run with production credentials. No script changes your active context.

## Run
```bash
bash run.sh
```

## Expected observations
Capstone 1 diagnoses and repairs a wrong Service selector. Capstone 2 backs up a PVC file externally, deletes it, restores it, and checks persistence. Capstone 3 proves CR field ownership conflicts, repeated reconciliation, repair and owner-reference garbage collection.

## Inspect if results differ
```bash
kubectl --context kind-kv-lab -n kv-lab get pods -l lab=m20 -o wide
kubectl --context kind-kv-lab -n kv-lab get events --sort-by=.metadata.creationTimestamp
kubectl --context kind-kv-lab -n kv-lab describe pods -l lab=m20
```

## Scope and prerequisites
All three capstones run against kind-kv-lab and kv-lab. The GitOps capstone uses explicit SSA apply as the declarative writer; Argo CD is optional in m19. The file backup is not a transaction-consistent database backup. Neither kind storage nor a one-member control plane proves production HA. A real operator must also solve RBAC, status conditions, retry/backoff, deletion semantics and leader election.

Application images use explicit version tags (nginx 1.28.0-alpine and BusyBox 1.37.0), not latest. Tags can be republished; production delivery should resolve and record registry digests. The kind node image is digest pinned.

## Private runtime outputs
Runtime outputs default to a private user-specific OS temporary directory, outside the extracted lab and the checkout: run `python3 backup-path.py m20` to print the exact selected location. Replace m20 with this lab's ID. Both capture and recovery use the same default. Set `KV_LAB_BACKUP_DIR` to an explicit private directory to override it; preserve that value for later recovery. The helper requires an owned directory with mode 0700, rejects artifact symlinks, and resolves paths before refusing any destination under this checkout's public/ or dist/ directories. Temporary storage can be cleared by the OS: copy wanted backups to a durable private destination before relying on them.

```bash
backup_dir=$(python3 backup-path.py m20)
printf 'Selected private output directory: %s\n' "$backup_dir"
```

## Cleanup
```bash
bash cleanup.sh
# When ALL labs are finished, destroy only the named disposable cluster:
kind delete cluster --name kv-lab
```
Cleanup removes this module's labeled resources. Some exercises create cluster-scoped CRDs or admission policy: their cleanup explicitly names those disposable resources. PVC cleanup deletes local data. Keep backups outside the cluster before cleanup.

The stateful procedure compares exact restored bytes at named checkpoints, prints byte counts/checksums without application data, and retains observed bytes privately if a checkpoint fails. It stops without retrying the restore. Both before-replacement and after-replacement observations use the private output directory.

## File-copy boundary

The stateful capstone uses kubectl cp for its small fixture and verifies exact bytes and SHA-256 before and after Pod replacement. The pinned BusyBox image supplies tar, which kubectl cp requires. Raw exec stdin transfers were observed to return success with missing data on the tested stack; changing client version alone did not remove that failure. A successful copy exit code is therefore followed by content verification. This exercise is not a general database backup or a large-file transfer guarantee.
