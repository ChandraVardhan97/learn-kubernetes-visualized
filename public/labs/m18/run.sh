#!/usr/bin/env bash
set -euo pipefail
umask 077
command -v python3 >/dev/null || { echo 'Python 3 required' >&2; exit 2; }
backup_dir=$(python3 "$(dirname "$0")/backup-path.py" m18)
echo "Private m18 output directory: $backup_dir"
source "$(dirname "$0")/_common.sh"
command -v docker >/dev/null || { echo 'Docker CLI required' >&2; exit 2; }
node=kv-lab-control-plane
staged=/var/lib/etcd/kv-lab.db
docker exec "$node" sh -c 'test ! -e "$1" && test ! -e "$1.part"' sh "$staged" || {
  echo 'The source staging file already exists or the node cannot be reached.' >&2
  exit 2
}
clean_stage() {
  local status=$?
  trap - EXIT
  docker exec "$node" rm -f "$staged" "$staged.part" || exit 1
  exit "$status"
}
trap clean_stage EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

k apply -f resources.yaml
kubectl --context kind-kv-lab -n kube-system exec "etcd-$node" -- etcdctl \
  --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save "$staged"
docker cp "$node:$staged" "$backup_dir/kv-lab.db"
[ -s "$backup_dir/kv-lab.db" ]
echo "Captured $backup_dir/kv-lab.db. Snapshot contains cluster API data including Secrets; protect this file."
echo 'Optional offline rehearsal: bash restore-offline.sh. Read RECOVERY.md first.'
