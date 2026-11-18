#!/usr/bin/env bash
# Explicitly destructive ONLY to the newly-created kv-recovery cluster.
set -euo pipefail
umask 077
command -v python3 >/dev/null || { echo 'Python 3 required' >&2; exit 2; }
command -v kubectl >/dev/null || { echo 'kubectl required' >&2; exit 2; }
client_version=$(kubectl version --client -o json | python3 -c 'import json,sys; print(json.load(sys.stdin)["clientVersion"]["gitVersion"])')
if [[ ! "$client_version" =~ ^v1\.37\.[0-9]+([+-].*)?$ ]]; then
  echo "Refusing: kubectl v1.37.x is required for the pinned v1.37 cluster; found $client_version." >&2
  exit 2
fi
backup_dir=$(python3 "$(dirname "$0")/backup-path.py" m18)
echo "Private m18 output directory: $backup_dir"
cd "$(dirname "$0")"
for tool in kind kubectl docker; do command -v "$tool" >/dev/null || { echo "Missing $tool" >&2; exit 2; }; done
[ -s "$backup_dir/kv-lab.db" ] || { echo "First run bash run.sh to capture $backup_dir/kv-lab.db" >&2; exit 2; }
if kind get clusters | grep -qx kv-recovery; then
  echo 'Refusing to overwrite an existing kv-recovery cluster. Inspect it, then explicitly delete it before retrying.' >&2; exit 2
fi
# Isolate kubeconfig output so cluster creation cannot change the caller active context.
export KUBECONFIG="$backup_dir/recovery.kubeconfig"
kind create cluster --name kv-recovery --config recovery-kind.yaml --wait 180s
node=kv-recovery-control-plane
[ "$(kind get nodes --name kv-recovery)" = "$node" ] || exit 2
etcd_image=$(kubectl --context kind-kv-recovery -n kube-system get pod etcd-kv-recovery-control-plane -o jsonpath='{.spec.containers[0].image}')
# The tool image comes from the recovery static Pod and matches its etcd version.
docker create --name kv-recovery-etcd-tool "$etcd_image" >/dev/null
trap 'docker rm -f kv-recovery-etcd-tool >/dev/null 2>&1 || true' EXIT
docker cp kv-recovery-etcd-tool:/usr/local/bin/etcdutl "$backup_dir/etcdutl"
docker cp "$backup_dir/etcdutl" "$node":/usr/local/bin/etcdutl
# Offline means both API server and etcd are stopped BEFORE replacing any data.
docker exec "$node" mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/kv-recovery-kube-apiserver.yaml
docker exec "$node" mv /etc/kubernetes/manifests/etcd.yaml /tmp/kv-recovery-etcd.yaml
for attempt in $(seq 1 90); do
  running=$(docker exec "$node" crictl ps --name etcd -q 2>/dev/null)
  api=$(docker exec "$node" crictl ps --name kube-apiserver -q 2>/dev/null)
  [ -z "$running$api" ] && break
  sleep 2
done
[ -z "$running$api" ] || { echo 'Refusing restore: old static containers still run' >&2; exit 1; }
docker cp "$backup_dir/kv-lab.db" "$node":/var/lib/kv-recovery-snapshot.db
docker exec "$node" test -s /var/lib/kv-recovery-snapshot.db
ip=$(docker inspect -f '{{(index .NetworkSettings.Networks "kind").IPAddress}}' "$node")
[ -n "$ip" ] || exit 1
docker exec "$node" etcdutl snapshot restore /var/lib/kv-recovery-snapshot.db --data-dir=/var/lib/etcd-restored --name="$node" --initial-cluster="$node=https://$ip:2380" --initial-advertise-peer-urls="https://$ip:2380" --bump-revision=1000000000 --mark-compacted
# Preserve the newly-created cluster's original data directory for investigation.
docker exec "$node" mv /var/lib/etcd /var/lib/etcd-before-restore
docker exec "$node" mv /var/lib/etcd-restored /var/lib/etcd
docker exec "$node" mv /tmp/kv-recovery-etcd.yaml /etc/kubernetes/manifests/etcd.yaml
docker exec "$node" mv /tmp/kv-recovery-kube-apiserver.yaml /etc/kubernetes/manifests/kube-apiserver.yaml
for attempt in $(seq 1 90); do
  kubectl --context kind-kv-recovery -n kv-lab get configmap m18 >/dev/null 2>&1 && break
  sleep 2
done
[ "$(kubectl --context kind-kv-recovery -n kv-lab get configmap m18 -o jsonpath='{.data.marker}')" = captured-before-disaster ]
echo 'Recovered marker visible through separate kind-kv-recovery API. Original kv-lab was never stopped or restored.'
printf 'Cleanup: KUBECONFIG=%q kind delete cluster --name kv-recovery\n' "$backup_dir/recovery.kubeconfig"
