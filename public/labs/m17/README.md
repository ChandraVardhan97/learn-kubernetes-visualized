# Identify a container memory-limit termination

Guided exercise

## Objective

Distinguish a container OOM termination from node pressure using the Pod state and node conditions.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Use the provided 16 MiB limit. The fixture uses a bounded write to a memory-backed volume.

**Initial state**

The fixture starts m17-oom. Its process fills a small memory-backed volume and reaches the container memory limit.

**Expected results**

- The container terminates with reason OOMKilled.
- The lab nodes remain Ready.

## Setup

1. Run the bounded fixture and wait for its terminal state.

   ```bash
   bash run.sh
   ```

## Diagnose

1. Inspect the container state and memory settings and view the worker conditions.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab describe pod m17-oom
     kubectl --context kind-kv-lab get nodes
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Use state.terminated.reason for the diagnosis. The container memory limit constrains this workload while the node continues operating. Kubernetes Pod eviction is a different mechanism with its own reason and events.

</details>

## Verify

1. Assert the termination reason directly and confirm node readiness.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get pod m17-oom -o jsonpath='{.status.containerStatuses[0].state.terminated.reason}')" = OOMKilled
     kubectl --context kind-kv-lab wait --for=condition=Ready nodes --all --timeout=90s
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Node-pressure eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/)
