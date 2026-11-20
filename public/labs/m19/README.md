# Repair declarative drift and inspect ownership

Troubleshooting challenge

## Objective

Detect divergence from a declared ConfigMap and restore it with the designated field manager.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Use the disposable ConfigMap only. The compatibility note is optional reading.

**Initial state**

kv-gitops applies release=git-declared. A manual patch changes the live value to manual-drift.

**Expected results**

- The diff identifies the drift.
- The live value returns to git-declared, and managed fields show kv-gitops owning the declared field.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Apply the declaration, then introduce a manual edit.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply --server-side --field-manager=kv-gitops -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab patch configmap m19 --type merge -p '{"data":{"release":"manual-drift"}}'
   )
   ```

## Diagnose

1. Read the field managers and compare declared versus live state. The kubectl diff exit code 1 means there is a difference.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get configmap m19 -o yaml --show-managed-fields
     status=0
     kubectl --context kind-kv-lab -n kv-lab diff -f resources.yaml || status=$?
     test "$status" -eq 1
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. After confirming the declaration is authoritative for this lab, apply it as kv-gitops with an explicit ownership takeover. This local exercise models one reconciliation step.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab apply --server-side --field-manager=kv-gitops --force-conflicts -f resources.yaml
   ```

</details>

## Verify

1. Check the restored field and inspect the resulting owner.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get configmap m19 -o jsonpath='{.data.release}')" = git-declared
     kubectl --context kind-kv-lab -n kv-lab get configmap m19 -o yaml --show-managed-fields
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Server-Side Apply and conflicts](https://kubernetes.io/docs/reference/using-api/server-side-apply/)
