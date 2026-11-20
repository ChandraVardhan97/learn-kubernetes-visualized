# Trace init ordering and a shared volume

Guided exercise

## Objective

Read init-container status and logs, then prove that two app containers can see the same emptyDir file.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- The accompanying container is a regular second container. The Secret contains teaching data.

**Initial state**

Pod m04 uses a ConfigMap and a Secret. Its init container prepares a file, then its app and companion containers start.

**Expected results**

- The init container finishes successfully before startup of the app.
- The app logs prepared and the greeting. The companion can read the shared file.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Apply the Pod and config objects and wait for readiness.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m04 --timeout=180s
   )
   ```

## Diagnose

1. Read the init status and inspect logs from the three named containers separately.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get pod m04 -o jsonpath='{.status.initContainerStatuses[0].state.terminated.reason}{"\n"}'
     kubectl --context kind-kv-lab -n kv-lab logs m04 -c prepare
     kubectl --context kind-kv-lab -n kv-lab logs m04 -c app
     kubectl --context kind-kv-lab -n kv-lab logs m04 -c companion --tail=2
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Read the same path from each running container. Both mounts refer to the Pod-scoped emptyDir.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab exec m04 -c app -- cat /work/ready
     kubectl --context kind-kv-lab -n kv-lab exec m04 -c companion -- cat /work/ready
   )
   ```

</details>

## Verify

1. Check successful init completion and matching volume contents.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get pod m04 -o jsonpath='{.status.initContainerStatuses[0].state.terminated.exitCode}')" = 0
     app=$(kubectl --context kind-kv-lab -n kv-lab exec m04 -c app -- cat /work/ready)
     companion=$(kubectl --context kind-kv-lab -n kv-lab exec m04 -c companion -- cat /work/ready)
     test "$app" = prepared
     test "$companion" = "$app"
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Init containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Volumes and emptyDir](https://kubernetes.io/docs/concepts/storage/volumes/)
