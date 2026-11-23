#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
mkdir -p "$fixture/bundle with spaces/.kv-lab/bin" "$fixture/commands"
bundle="$fixture/bundle with spaces"
cp public/labs/{setup.sh,lab-env.sh,kind.yaml} "$bundle/"
export KV_TEST_CALLS="$fixture/calls"
export PATH="$fixture/commands:$PATH"
export KUBECONFIG="$fixture/original"
printf 'original kubeconfig\n' > "$KUBECONFIG"
cat > "$fixture/commands/docker" <<'SH'
#!/usr/bin/env bash
case "$1 $2" in
  'context inspect') echo unix:///var/run/docker.sock ;;
  'info --format') echo linux ;;
  'image inspect') exit 1 ;;
  'pull busybox:1.37.0') echo 'test credential helper failure' >&2; exit 1 ;;
  *) exit 99 ;;
esac
SH
cat > "$bundle/.kv-lab/bin/kind" <<'SH'
#!/usr/bin/env bash
case "$1" in
  version) echo 'kind v0.33.0 test' ;;
  get) printf '%s\n' "${KV_TEST_CLUSTERS:-}" ;;
  *) echo "unexpected kind command: $*" >> "$KV_TEST_CALLS"; exit 99 ;;
esac
SH
cat > "$bundle/.kv-lab/bin/kubectl" <<'SH'
#!/usr/bin/env bash
echo '{"clientVersion":{"gitVersion":"v1.37.0"}}'
SH
chmod +x "$fixture/commands/docker" "$bundle/.kv-lab/bin/"*
unset DOCKER_HOST
if bash "$bundle/setup.sh" > "$fixture/pull.log" 2>&1; then
  echo 'Setup must stop when a public image cannot be pulled' >&2; exit 1
fi
grep -F 'Could not pull busybox:1.37.0' "$fixture/pull.log"
test ! -e "$KV_TEST_CALLS"
test ! -e "$bundle/.kv-lab/kubeconfig"
export KV_TEST_CLUSTERS=kv-lab
if bash "$bundle/setup.sh" > "$fixture/existing.log" 2>&1; then
  echo 'Setup must refuse an existing lab cluster' >&2; exit 1
fi
grep -F 'kv-lab already exists' "$fixture/existing.log"
test ! -e "$KV_TEST_CALLS"
grep -Fx 'original kubeconfig' "$KUBECONFIG"
if source "$bundle/lab-env.sh" 2>/dev/null; then
  echo 'Activation must fail before a dedicated kubeconfig exists' >&2; exit 1
fi
test "$KUBECONFIG" = "$fixture/original"
echo 'PASS setup guards leave existing Docker and Kubernetes state alone'
