# Read Leases and verify a convergent apply

Guided exercise

## Objective

Compare a manually written Lease with control-plane Leases and check whether repeated desired state changes object identity.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- The pinned kind cluster uses kubeadm control-plane components and includes their Leases in kube-system.

**Initial state**

The lab starts with ConfigMap m15 and a manually created Lease. The fixture has no election contender or Lease-renewal process.

**Expected results**

- Lease m15 identifies manual-demo as its holder.
- Repeatedly applying the ConfigMap preserves its UID and data.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Create the teaching Lease and ConfigMap.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
   ```

## Diagnose

1. Compare the teaching Lease to the control-plane Leases and read the ConfigMap.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get lease m15 -o yaml
     kubectl --context kind-kv-lab -n kube-system get leases
     kubectl --context kind-kv-lab -n kv-lab get configmap m15 -o yaml
   )
   ```

2. Open a short watch. The initial output is the current ConfigMap. With no changes made, the watch can end at the request deadline.

   ```bash
   (
     set -euo pipefail
     status=0
     watch=$(kubectl --context kind-kv-lab -n kv-lab get configmap m15 --watch --request-timeout=6s -o name 2>&1) || status=$?
     printf '%s\n' "$watch"
     printf '%s\n' "$watch" | grep -Fx configmap/m15
     if [ "$status" -ne 0 ]; then
       printf '%s\n' "$watch" | grep -Ei 'timeout|timed out|context deadline'
     fi
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Save identity and data, apply the file again, and compare. A controller can reconcile repeatedly without replacing the object.

   ```bash
   (
     set -euo pipefail
     before=$(kubectl --context kind-kv-lab -n kv-lab get configmap m15 -o jsonpath='{.metadata.uid}{.data}')
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     test "$(kubectl --context kind-kv-lab -n kv-lab get configmap m15 -o jsonpath='{.metadata.uid}{.data}')" = "$before"
   )
   ```

</details>

## Verify

1. Check the named holder and the ConfigMap data independently.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get lease m15 -o jsonpath='{.spec.holderIdentity}')" = manual-demo
     kubectl --context kind-kv-lab -n kv-lab get configmap m15 -o yaml
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Leases](https://kubernetes.io/docs/concepts/architecture/leases/)
- [Kubernetes API watches](https://kubernetes.io/docs/reference/using-api/api-concepts/)
