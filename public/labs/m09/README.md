# Keep a PVC file across Pod replacement

Guided exercise

## Objective

Follow the PVC to its bound volume and verify that replacing its consumer leaves stored content intact.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Use the default local-path provisioner. This lab demonstrates a Pod replacement on local storage.

**Initial state**

The fixture creates PVC m09 and its consumer Pod. The default StorageClass provisions a local volume once the consumer is placed.

**Expected results**

- The claim becomes Bound.
- A new Pod reads the original marker from /data/proof.txt and uses the same PV.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Create the claim and its first consumer.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m09 --timeout=180s
   )
   ```

## Diagnose

1. Inspect the claim, StorageClass binding mode, mount and backing PV.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get pvc m09
     kubectl --context kind-kv-lab get storageclass
     volume=$(kubectl --context kind-kv-lab -n kv-lab get pvc m09 -o jsonpath='{.spec.volumeName}')
     kubectl --context kind-kv-lab get pv "$volume"
     kubectl --context kind-kv-lab -n kv-lab describe pod m09
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Write the marker, replace only the Pod, and compare the old and new UIDs and volume bindings.

   ```bash
   (
     set -euo pipefail
     old=$(kubectl --context kind-kv-lab -n kv-lab get pod m09 -o jsonpath='{.metadata.uid}')
     volume=$(kubectl --context kind-kv-lab -n kv-lab get pvc m09 -o jsonpath='{.spec.volumeName}')
     kubectl --context kind-kv-lab -n kv-lab exec m09 -- sh -c 'echo survives-pod-replacement > /data/proof.txt'
     kubectl --context kind-kv-lab -n kv-lab delete pod m09 --wait=true
     kubectl --context kind-kv-lab -n kv-lab apply -f consumer.yaml
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m09 --timeout=180s
     test "$(kubectl --context kind-kv-lab -n kv-lab get pod m09 -o jsonpath='{.metadata.uid}')" != "$old"
     test "$(kubectl --context kind-kv-lab -n kv-lab get pvc m09 -o jsonpath='{.spec.volumeName}')" = "$volume"
   )
   ```

</details>

## Verify

1. Read the existing marker from the replacement Pod.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get pvc m09 -o jsonpath='{.status.phase}')" = Bound
     test "$(kubectl --context kind-kv-lab -n kv-lab exec m09 -- cat /data/proof.txt)" = survives-pod-replacement
   )
   ```

## Clean up

1. Remove the Pod and claim. The lab provisioner will reclaim the volume and delete the teaching file.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [StorageClasses](https://kubernetes.io/docs/concepts/storage/storage-classes/)
