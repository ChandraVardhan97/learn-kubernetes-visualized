# Update a ConfigMap without replacing it

Guided exercise

## Objective

Use an explicit context and label selector, then distinguish object identity from resource version.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Leave your current kubectl context alone. The commands explicitly target the local lab.

**Initial state**

ConfigMap m03 has the lab=m03 label and data.message=hello. No application Pods are needed.

**Expected results**

- The selector finds the ConfigMap in kv-lab.
- A new annotation appears, resourceVersion changes, and the UID stays the same.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Create the ConfigMap.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
   ```

## Diagnose

1. Read the ConfigMap by its lab label. Compare the selected context with the default one shown by current-context.

   ```bash
   (
     set -euo pipefail
     kubectl config current-context
     kubectl --context kind-kv-lab -n kv-lab get configmaps -l lab=m03 -o yaml
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Capture the UID and version, write a unique annotation, then re-read both values. Treat resourceVersion as an opaque value.

   ```bash
   (
     set -euo pipefail
     uid=$(kubectl --context kind-kv-lab -n kv-lab get cm m03 -o jsonpath='{.metadata.uid}')
     before=$(kubectl --context kind-kv-lab -n kv-lab get cm m03 -o jsonpath='{.metadata.resourceVersion}')
     value=$(python3 -c 'import uuid; print("metadata-" + uuid.uuid4().hex)')
     kubectl --context kind-kv-lab -n kv-lab annotate cm m03 "experiment=$value" --overwrite
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     test "$(kubectl --context kind-kv-lab -n kv-lab get cm m03 -o jsonpath='{.metadata.uid}')" = "$uid"
     test "$(kubectl --context kind-kv-lab -n kv-lab get cm m03 -o jsonpath='{.metadata.resourceVersion}')" != "$before"
     test "$(kubectl --context kind-kv-lab -n kv-lab get cm m03 -o jsonpath='{.metadata.annotations.experiment}')" = "$value"
   )
   ```

</details>

## Verify

1. Confirm the declared data is intact and the annotation is set.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get cm m03 -o jsonpath='{.data.message}')" = hello
     test -n "$(kubectl --context kind-kv-lab -n kv-lab get cm m03 -o jsonpath='{.metadata.annotations.experiment}')"
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Kubernetes API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/)
- [Labels and selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)
