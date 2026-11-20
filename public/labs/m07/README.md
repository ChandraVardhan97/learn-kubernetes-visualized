# Explain why a Pod is Pending

Guided exercise

## Objective

Use scheduling conditions and node labels to trace an impossible placement constraint.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Use the default lab nodes. Leave their labels unchanged for this exercise.

**Initial state**

m07-allowed can schedule, while m07-pending requests a node label absent from the cluster. The runner waits for the expected status of both.

**Expected results**

- m07-pending is Pending with PodScheduled=False and reason Unschedulable.
- m07-allowed is Ready and reports Burstable QoS.

## Setup

1. Create the two Pod fixtures.

   ```bash
   bash run.sh
   ```

## Diagnose

1. Read the scheduling condition and compare the requested selector to actual node labels.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab describe pod m07-pending
     kubectl --context kind-kv-lab -n kv-lab get pod m07-pending -o jsonpath='{.spec.nodeSelector}{"\n"}'
     kubectl --context kind-kv-lab get nodes --show-labels
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. The selector is a hard scheduling requirement, so the scheduler rejects every node. Burstable QoS is a separate consequence of the allowed Pod resource configuration. Leave the two fixtures as they are to preserve the comparison.

</details>

## Verify

1. Confirm the two distinct outcomes.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get pod m07-pending -o 'jsonpath={.status.conditions[?(@.type=="PodScheduled")].reason}')" = Unschedulable
     test "$(kubectl --context kind-kv-lab -n kv-lab get pod m07-allowed -o jsonpath='{.status.qosClass}')" = Burstable
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m07-allowed --timeout=60s
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Assigning Pods to nodes](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
- [Pod QoS](https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/)
