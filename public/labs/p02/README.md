# Place a Pod on a tainted worker

Troubleshooting challenge

## Objective

Read scheduler evidence and allow one designated Pod onto a reserved worker with a narrowly matching toleration.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Work in p02. The default worker kv-lab-worker must exist. Leave its teaching taint in place while solving.

**Initial state**

The starter taints kv-lab-worker with labs.kv.example/p02=reserved:NoSchedule. Pod p02 selects that worker and remains Pending.

**Expected results**

- The original Pod tolerates exactly the teaching taint and is assigned to kv-lab-worker.
- Cleanup removes the annotation and taint added by the starter.

## Setup

1. Create the lab-owned taint and pending fixture.

   ```bash
   bash start.sh
   ```

## Diagnose

1. Compare the worker taint with the Pod constraints and the FailedScheduling event.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab describe pod p02
     kubectl --context kind-kv-lab describe node kv-lab-worker
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Append a toleration for the key, value and effect, leaving the default tolerations intact. Keep nodeSelector because a toleration permits placement but does not choose a node.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab patch pod p02 --type json -p '[{"op":"add","path":"/spec/tolerations/-","value":{"key":"labs.kv.example/p02","operator":"Equal","value":"reserved","effect":"NoSchedule"}}]'
   ```

</details>

## Verify

1. Wait for readiness and read the assigned node.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/p02 --timeout=180s
     test "$(kubectl --context kind-kv-lab -n kv-lab get pod p02 -o jsonpath='{.spec.nodeName}')" = kv-lab-worker
   )
   ```

## Clean up

1. Remove the Pod and the worker metadata owned by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Taints and Tolerations](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
