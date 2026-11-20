# Resolve a field conflict and release a finalizer

Guided exercise

## Objective

Observe two independent API mechanisms: field ownership during a write and a finalizer blocking deletion.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Only remove the teaching finalizer on this ConfigMap. It has no external state to clean up.

**Initial state**

Field manager kv-gitops owns declared data on ConfigMap m14. A different manifest proposes a conflicting value.

**Expected results**

- An apply by kv-human fails with a field conflict.
- After adding the teaching finalizer, deletion sets a timestamp. Removing the finalizer completes deletion.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Establish the original field ownership.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab apply --server-side --field-manager=kv-gitops -f resources.yaml
   ```

## Diagnose

1. Inspect field ownership and require a genuine conflict from the second manager.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get configmap m14 -o yaml --show-managed-fields
     if result=$(kubectl --context kind-kv-lab -n kv-lab apply --server-side --field-manager=kv-human -f conflict.yaml 2>&1); then
       echo 'Expected an SSA field conflict' >&2; exit 1
     fi
     printf '%s\n' "$result" | grep -i conflict
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Resolve intent with the current owner. Keep the original writer and value for this exercise. The finalizer below demonstrates a separate deletion mechanism. Start with the clean teaching ConfigMap, before any finalizers have been added.

2. Request deletion with a finalizer present and inspect the timestamp. Remove the lab marker after confirming that this fixture has no external work.

   ```bash
   (
     set -euo pipefail
     test -z "$(kubectl --context kind-kv-lab -n kv-lab get configmap m14 -o jsonpath='{.metadata.finalizers[*]}')"
     kubectl --context kind-kv-lab -n kv-lab patch configmap m14 --type merge -p '{"metadata":{"finalizers":["labs.kv.example/hold"]}}'
     kubectl --context kind-kv-lab -n kv-lab delete configmap m14 --wait=false
     test -n "$(kubectl --context kind-kv-lab -n kv-lab get configmap m14 -o jsonpath='{.metadata.deletionTimestamp}')"
     kubectl --context kind-kv-lab -n kv-lab get configmap m14 -o yaml
     bash release-hold.sh
   )
   ```

</details>

## Verify

1. Wait for the ConfigMap to disappear from the API.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab wait --for=delete configmap/m14 --timeout=30s
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Server-Side Apply](https://kubernetes.io/docs/reference/using-api/server-side-apply/)
- [Finalizers](https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/)
