#!/usr/bin/env bash
set -euo pipefail
umask 077

fail() { printf 'Lab setup: %s\n' "$*" >&2; exit 1; }
cd "$(dirname "${BASH_SOURCE[0]}")"
bundle=$(pwd -P)
state="$bundle/.kv-lab"
case "$bundle" in
  */public/labs|*/dist/labs) fail 'Extract kv-labs.zip into a private directory and run setup there.' ;;
esac
[[ -f kind.yaml && -f lab-env.sh ]] || fail 'Extract the complete kv-labs.zip before running setup.'
for tool in docker curl python3; do
  command -v "$tool" >/dev/null || fail "Install $tool in this terminal. See the bundle README."
done

case "$(uname -s)" in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *) fail 'Use Terminal on macOS or Bash in Ubuntu on WSL 2.' ;;
esac
if [[ "$os" == linux && "$(uname -r)" == *[Mm]icrosoft* && "$bundle" == /mnt/[a-z]/* ]]; then
  fail 'Extract the ZIP inside your Ubuntu home directory and run setup there.'
fi
case "$(uname -m)" in
  x86_64|amd64) arch=amd64 ;;
  arm64|aarch64) arch=arm64 ;;
  *) fail 'Use an AMD64 or ARM64 host.' ;;
esac

docker_endpoint=${DOCKER_HOST:-}
if [[ -z "$docker_endpoint" || -n "${DOCKER_CONTEXT:-}" ]]; then
  docker_endpoint=$(docker context inspect --format '{{.Endpoints.docker.Host}}') ||
    fail 'Could not read the Docker context. Select your local Docker Desktop context.'
fi
[[ "$docker_endpoint" == unix:///* ]] || fail 'Select your local Docker engine using a Unix socket.'
docker_os=$(docker info --format '{{.OSType}}') ||
  fail 'Start Docker Desktop and enable integration for your Ubuntu distribution on Windows.'
[[ "$docker_os" == linux ]] || fail 'Switch Docker Desktop to Linux containers.'

for path in "$state" "$state/bin" "$state/kubeconfig"; do
  [[ ! -L "$path" ]] || fail "Refusing a symlink at $path."
done
mkdir -p "$state/bin"
chmod 700 "$state" "$state/bin"
export PATH="$state/bin:$PATH"
export KIND_EXPERIMENTAL_PROVIDER=docker
export KUBECONFIG="$state/kubeconfig"

install_cli() (
  name=$1
  url=$2
  checksum_url=$3
  scratch=$(mktemp -d "$state/bin/.download.XXXXXX")
  trap 'rm -rf -- "$scratch"' EXIT
  curl --fail --silent --show-error --location --retry 2 --connect-timeout 15 --max-time 180 \
    "$url" --output "$scratch/$name" || fail "Could not download $name. Check your network and rerun setup."
  curl --fail --silent --show-error --location --retry 2 --connect-timeout 15 --max-time 60 \
    "$checksum_url" --output "$scratch/sha256" || fail "Could not download the checksum for $name."
  python3 - "$scratch/$name" "$scratch/sha256" <<'PY'
import hashlib
from pathlib import Path
import sys

binary, checksum = map(Path, sys.argv[1:])
expected = checksum.read_text().split()[0]
digest = hashlib.sha256()
with binary.open('rb') as stream:
    for block in iter(lambda: stream.read(1024 * 1024), b''):
        digest.update(block)
if digest.hexdigest() != expected:
    sys.exit(f'Lab setup: checksum mismatch for {binary.name}. The download was not installed.')
PY
  chmod 700 "$scratch/$name"
  mv -f "$scratch/$name" "$state/bin/$name"
)

kind_asset="https://github.com/kubernetes-sigs/kind/releases/download/v0.33.0/kind-$os-$arch"
kubectl_asset="https://dl.k8s.io/release/v1.37.0/bin/$os/$arch/kubectl"
if [[ ! -x "$state/bin/kind" ]] || ! "$state/bin/kind" version | grep -Eq '^kind v0\.33\.0([[:space:]]|$)'; then
  echo "Installing kind v0.33.0 ($os/$arch) in .kv-lab/bin ..."
  install_cli kind "$kind_asset" "$kind_asset.sha256sum"
fi
if [[ ! -x "$state/bin/kubectl" ]] || ! "$state/bin/kubectl" version --client -o json |
  python3 -c 'import json, sys; sys.exit(json.load(sys.stdin)["clientVersion"]["gitVersion"] != "v1.37.0")'; then
  echo "Installing kubectl v1.37.0 ($os/$arch) in .kv-lab/bin ..."
  install_cli kubectl "$kubectl_asset" "$kubectl_asset.sha256"
fi

clusters=$(kind get clusters) || fail 'Could not list kind clusters. Check Docker Desktop and try again.'
if grep -qx kv-lab <<< "$clusters"; then
  fail 'kv-lab already exists. Use its original bundle or remove it before setting up a new cluster.'
fi
if [[ -e "$KUBECONFIG" ]]; then
  config_contexts=$(kubectl config get-contexts -o name) || fail 'Could not read the existing lab kubeconfig.'
  [[ -z "$config_contexts" || "$config_contexts" == kind-kv-lab ]] ||
    fail 'The lab kubeconfig contains another context. Extract a fresh bundle in a different directory.'
fi
echo 'Checking workload images in Docker ...'
for image in busybox:1.37.0 nginx:1.28.0-alpine; do
  docker image inspect "$image" >/dev/null 2>&1 || docker pull "$image" ||
    fail "Could not pull $image. Check Docker registry connectivity or follow the README credential-helper troubleshooting."
done

echo 'Creating kv-lab and waiting for its nodes and DNS ...'
kind create cluster --name kv-lab --config "$bundle/kind.yaml" --kubeconfig "$KUBECONFIG" --wait 180s
if ! kubectl --context kind-kv-lab wait --for=condition=Ready nodes --all --timeout=180s ||
   ! kubectl --context kind-kv-lab -n kube-system rollout status deployment/coredns --timeout=180s; then
  fail 'kv-lab was created but is not ready. Source ./lab-env.sh and inspect it before retrying.'
fi
kubectl --context kind-kv-lab get nodes
echo 'Run source ./lab-env.sh from the extracted bundle to use this cluster.'
