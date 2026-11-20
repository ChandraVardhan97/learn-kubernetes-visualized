#!/usr/bin/env bash
set -euo pipefail
umask 077
command -v python3 >/dev/null || { echo 'Python 3 required' >&2; exit 2; }
backup_dir=$(python3 "$(dirname "$0")/backup-path.py" m20)
echo "Private m20 output directory: $backup_dir"
source "$(dirname "$0")/_common.sh"
# Compare exact bytes without printing application data. On failure, retain the
# observed bytes privately so diagnostics survive module cleanup. This never retries.
verify_checkpoint() {
  local checkpoint="$1"
  local observed="$backup_dir/orders.restored-$checkpoint.bin"
  local read_status=0
  k exec m20-data -- cat /data/orders.csv > "$observed" || read_status=$?
  python3 - "$backup_dir/orders.csv" "$observed" "$checkpoint" "$read_status" <<'PY'
import hashlib, pathlib, sys
expected_path, observed_path, checkpoint, status = sys.argv[1:]
expected, actual = pathlib.Path(expected_path).read_bytes(), pathlib.Path(observed_path).read_bytes()
print('checkpoint='+checkpoint+' exec_status='+status+' expected_bytes='+str(len(expected))+' actual_bytes='+str(len(actual))+' expected_sha256='+hashlib.sha256(expected).hexdigest()+' actual_sha256='+hashlib.sha256(actual).hexdigest())
if int(status) or expected != actual:
    print('Restore check failed; actual bytes retained privately at '+observed_path,file=sys.stderr)
    sys.exit(int(status) or 1)
PY
}
prepare_loss() {
  k apply -f stateful.yaml
  wait_ready m20-data
  k exec m20-data -- sh -c 'printf "order-42,confirmed\n" > /data/orders.csv'
  # Capture the small fixture; keep the backup outside the cluster and published assets.
  k exec m20-data -- cat /data/orders.csv > "$backup_dir/orders.csv"
  [ -s "$backup_dir/orders.csv" ]
  python3 - "$backup_dir/orders.csv" <<'PY'
import hashlib,pathlib,sys
actual=pathlib.Path(sys.argv[1]).read_bytes()
print('checkpoint=backup captured_bytes='+str(len(actual))+' sha256='+hashlib.sha256(actual).hexdigest())
if actual != b'order-42,confirmed\n':
    print('Captured backup bytes differ from the declared teaching fixture; stopping before data deletion.',file=sys.stderr)
    sys.exit(1)
PY
  # Simulate logical data loss, not a fake Pod restart restoration.
  k exec m20-data -- rm /data/orders.csv
  k exec m20-data -- sh -c 'test ! -e /data/orders.csv'
}

restore_file() {
  restore_status=0
  # kubectl cp uses tar, which is present in the pinned BusyBox image.
  # Raw short-lived exec stdin transfers were observed to lose data in this fixture.
  k cp "$backup_dir/orders.csv" m20-data:/data/orders.csv || restore_status=$?
  if [ "$restore_status" -ne 0 ]; then
    echo "checkpoint=file-copy-restore exec_status=$restore_status; collecting actual bytes without retrying restore" >&2
    verify_checkpoint before-replacement || true
    exit "$restore_status"
  fi
  verify_checkpoint before-replacement
}

replace_consumer() {
  # A second check proves restored data persists after Pod replacement.
  k delete pod m20-data --wait=true
  k apply -f data-consumer.yaml
  wait_ready m20-data
}

case "${1:-all}" in
  start) prepare_loss ;;
  restore) restore_file ;;
  replace) replace_consumer ;;
  verify) verify_checkpoint after-replacement ;;
  all)
    prepare_loss
    restore_file
    replace_consumer
    verify_checkpoint after-replacement
    echo 'File backup, deletion, restoration and replacement verified. This is not a database-consistent backup.'
    ;;
  *) echo 'Usage: bash capstone-stateful.sh [start|restore|replace|verify|all]' >&2; exit 2 ;;
esac
