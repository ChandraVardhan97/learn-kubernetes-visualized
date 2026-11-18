#!/usr/bin/env bash
set -euo pipefail
umask 077
command -v python3 >/dev/null || { echo 'Python 3 required' >&2; exit 2; }
backup_dir=$(python3 "$(dirname "$0")/backup-path.py" m18)
echo "Private m18 output directory: $backup_dir"
source "$(dirname "$0")/_common.sh"
command -v docker >/dev/null || { echo 'Docker CLI required' >&2; exit 2; }
umask 077
k apply -f resources.yaml
kubectl --context kind-kv-lab -n kube-system exec etcd-kv-lab-control-plane -- etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /var/lib/etcd/kv-lab.db
docker cp kv-lab-control-plane:/var/lib/etcd/kv-lab.db "$backup_dir/kv-lab.db"
[ -s "$backup_dir/kv-lab.db" ]
docker exec kv-lab-control-plane rm -f /var/lib/etcd/kv-lab.db
echo "Captured $backup_dir/kv-lab.db. Snapshot contains all cluster API data, including Secrets; protect this file."
echo 'Optional offline rehearsal: bash restore-offline.sh. Read RECOVERY.md first.'
