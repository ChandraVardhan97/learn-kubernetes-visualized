# Bind a PVC with the intended StorageClass

Troubleshooting challenge

## Objective

Trace why a claim cannot be provisioned, then bind a clean teaching claim without modifying the provisioner.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Work in p03 and keep the kind local-path StorageClass. Only replace the unbound teaching claim.

**Initial state**

PVC p03 explicitly names p03-missing, which the cluster does not provide. Its consumer waits for storage.

**Expected results**

- The replacement claim uses standard and becomes Bound.
- The consuming Pod reads a file it wrote to the mounted directory.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Apply the claim and its consumer.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab apply -f claim.yaml -f consumer.yaml
   ```

## Diagnose

1. Compare the requested class with the available ones. Inspect the storage and scheduling events.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab get storageclass
     kubectl --context kind-kv-lab -n kv-lab describe pvc p03
     kubectl --context kind-kv-lab -n kv-lab describe pod p03
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Confirm the claim is Pending and has no assigned PV. Recreate the teaching claim with standard and let the existing consumer trigger provisioning.

   ```bash
   (
     set -euo pipefail
     if [ "$(kubectl --context kind-kv-lab -n kv-lab get pvc p03 -o jsonpath='{.status.phase}:{.spec.volumeName}')" != Pending: ]; then
       echo 'Refusing to replace a claim that is not Pending and unbound.' >&2
       false
     else
       kubectl --context kind-kv-lab -n kv-lab delete pvc p03 --wait=false &&
       kubectl --context kind-kv-lab -n kv-lab delete pod p03 --wait=true &&
       kubectl --context kind-kv-lab -n kv-lab wait --for=delete pvc/p03 --timeout=60s &&
       sed 's/storageClassName: p03-missing/storageClassName: standard/' claim.yaml | kubectl --context kind-kv-lab -n kv-lab apply -f - &&
       kubectl --context kind-kv-lab -n kv-lab apply -f consumer.yaml &&
       kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/p03 --timeout=180s &&
       kubectl --context kind-kv-lab -n kv-lab exec p03 -- sh -c 'echo storage-ready > /data/marker'
     fi
   )
   ```

</details>

## Verify

1. Wait for the mount, confirm the claim is bound and read back a marker.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/p03 --timeout=180s
     test "$(kubectl --context kind-kv-lab -n kv-lab get pvc p03 -o jsonpath='{.spec.storageClassName}:{.status.phase}')" = standard:Bound
     test "$(kubectl --context kind-kv-lab -n kv-lab exec p03 -- cat /data/marker)" = storage-ready
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [StorageClasses](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
