# M18 exercises

## Capture a private etcd snapshot

Guided exercise

### Objective

Save a known API object in an etcd snapshot and establish that a private backup file exists outside the cluster.

### Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Docker must be accessible. Keep the private snapshot directory for the optional restore. The snapshot contains the lab API state, including Secrets.

**Initial state**

The source kind cluster is running and the starter directory contains resources.yaml for a ConfigMap marker.

**Expected results**

- The ConfigMap contains captured-before-disaster.
- A non-empty kv-lab.db exists in the private directory printed by the runner. The source node no longer has the temporary copy.

### Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Create the marker and identify the source etcd Pod.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kube-system get pod etcd-kv-lab-control-plane -o wide
   )
   ```

### Diagnose

1. Read the known marker before taking the snapshot and check the source API availability.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get configmap m18 -o yaml
     kubectl --context kind-kv-lab get --raw=/readyz
   )
   ```

### Solution

<details>
<summary>Reveal solution</summary>

1. Run the snapshot procedure. It requests a consistent snapshot with the source etcd TLS files, copies it into the private directory, and removes the node copy.

   ```bash
   bash run.sh
   ```

</details>

### Verify

1. Check the source marker and both file locations.

   ```bash
   (
     set -euo pipefail
     directory=$(python3 backup-path.py m18)
     test -s "$directory/kv-lab.db"
     test "$(kubectl --context kind-kv-lab -n kv-lab get configmap m18 -o jsonpath='{.data.marker}')" = captured-before-disaster
     docker exec kv-lab-control-plane test ! -e /var/lib/etcd/kv-lab.db
   )
   ```

### Clean up

1. Remove the marker when done with capture. The private snapshot remains available for the restore exercise.

   ```bash
   bash cleanup.sh
   ```

### Official references

- [etcd 3.7 disaster recovery](https://etcd.io/docs/v3.7/op-guide/recovery/)

---

## Restore the snapshot into a new cluster

Guided exercise

### Objective

Restore the saved marker through a separate API server and verify the original cluster still responds.

### Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Complete snapshot capture first and keep the same private backup directory.
- The restore needs Docker resources for a second single-node cluster. No kv-recovery cluster may exist. Read RECOVERY.md before starting.

**Initial state**

The source API is healthy and kv-lab.db is present. No recovery cluster exists.

**Expected results**

- The recovered API returns captured-before-disaster from ConfigMap m18.
- The source API still answers readiness checks. Cleanup removes only kv-recovery.

### Setup

1. Confirm the snapshot exists and the recovery name is free.

   ```bash
   (
     set -euo pipefail
     directory=$(python3 backup-path.py m18)
     test -s "$directory/kv-lab.db"
     [[ "$(kind get clusters 2>/dev/null)" != *kv-recovery* ]]
   )
   ```

### Diagnose

1. Check which cluster provides the source API and which node currently hosts its etcd Pod.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab get --raw=/readyz
     kubectl --context kind-kv-lab -n kube-system get pod etcd-kv-lab-control-plane -o wide
   )
   ```

### Solution

<details>
<summary>Reveal solution</summary>

1. Run the offline restore. It creates kv-recovery, stops its API server and etcd, restores to a fresh data directory with a revision bump, and restarts both static Pods.

   ```bash
   bash restore-offline.sh
   ```

</details>

### Verify

1. Read the marker using the recovery-only kubeconfig and check the source API separately.

   ```bash
   (
     set -euo pipefail
     directory=$(python3 backup-path.py m18)
     marker=$(KUBECONFIG="$directory/recovery.kubeconfig" kubectl --context kind-kv-recovery -n kv-lab get configmap m18 -o jsonpath='{.data.marker}')
     test "$marker" = captured-before-disaster
     kubectl --context kind-kv-lab get --raw=/readyz
   )
   ```

### Clean up

1. Delete the disposable recovery cluster. Keep any snapshot you explicitly want to retain.

   ```bash
   bash cleanup-recovery.sh
   ```

### Official references

- [etcd 3.7 disaster recovery](https://etcd.io/docs/v3.7/op-guide/recovery/)
