# Disposable offline etcd restoration

Run bash run.sh to capture the source snapshot, then bash restore-offline.sh only if Docker has enough capacity for another control plane. The script refuses an existing kv-recovery cluster. It writes a separate recovery.kubeconfig in the private directory selected by backup-path.py and never changes your original active context.

Runtime outputs default to a private user-specific OS temporary directory, outside the extracted lab and the checkout: run `python3 backup-path.py m18` to print the exact selected location. Replace m18 with this lab's ID. Both capture and recovery use the same default. Set `KV_LAB_BACKUP_DIR` to an explicit private directory to override it; preserve that value for later recovery. The helper requires an owned directory with mode 0700, rejects artifact symlinks, and resolves paths before refusing any destination under this checkout's public/ or dist/ directories. Temporary storage can be cleared by the OS: copy wanted backups to a durable private destination before relying on them.

```bash
backup_dir=$(python3 backup-path.py m18)
printf 'Snapshot: %s/kv-lab.db\n' "$backup_dir"
printf 'Recovery kubeconfig: %s/recovery.kubeconfig\n' "$backup_dir"
```

The recovery script is intentionally explicit: capture the recovery etcd tool version; stop kube-apiserver and etcd static Pods; wait for both containers to exit; stage the snapshot under /var/lib and confirm it exists; restore to a new data directory with new single-member URLs, a revision bump and compaction; retain the fresh cluster's old directory; restart static Pods; read m18 from the restored API. Source node objects may remain in the snapshot: this is an API-data rehearsal, not a supported migration or a functioning restored worker fleet.

If failure occurs after static Pod removal, inspect ONLY kv-recovery-control-plane with docker exec and its files under /tmp. Run bash cleanup-recovery.sh with the same private backup directory. It checks the recovery node identity recorded during setup before deleting the cluster. Never run replacement-directory commands on kv-lab-control-plane or a production member.

An etcd snapshot is not a backup of PV files, external object stores, images, kubeadm configuration, PKI, service-account signing keys or encryption-at-rest keys. Real recovery requires those assets, tested version compatibility, member planning and workload checks.

Sources: https://etcd.io/docs/v3.7/op-guide/recovery/ and https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/
