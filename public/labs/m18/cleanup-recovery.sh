#!/usr/bin/env bash
set -euo pipefail
directory=$(python3 "$(dirname "$0")/backup-path.py" m18)
clusters=$(kind get clusters)
if ! grep -qx kv-recovery <<< "$clusters"; then
  rm -f "$directory/recovery-node-id"
  exit 0
fi

node=kv-recovery-control-plane
[ -s "$directory/recovery-node-id" ] && [ -s "$directory/recovery.kubeconfig" ] || {
  echo 'Refusing to remove a recovery cluster without the identity saved by this exercise.' >&2
  exit 2
}
id=$(docker inspect --format '{{.Id}}' "$node")
nodes=$(kind get nodes --name kv-recovery)
[ "$nodes" = "$node" ] && [ "$id" = "$(cat "$directory/recovery-node-id")" ] || {
  echo 'Refusing to remove a different recovery cluster.' >&2
  exit 2
}
KUBECONFIG="$directory/recovery.kubeconfig" kind delete cluster --name kv-recovery
rm -f "$directory/recovery-node-id"
