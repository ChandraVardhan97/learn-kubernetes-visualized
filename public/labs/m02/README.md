# Watch a ReplicaSet replace a deleted Pod

Guided exercise

## Objective

Trace Deployment ownership and verify that the controller replaces a Pod with a new identity.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- The Deployment needs enough capacity to schedule two small nginx Pods.

**Initial state**

The setup applies Deployment m02 with two replicas and waits for both to become available.

**Expected results**

- A ReplicaSet owns the original Pod.
- After you delete one Pod, its UID disappears and the same Deployment again has two ready replicas.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Apply the Deployment and wait for it to become available.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m02 --timeout=180s
   )
   ```

## Diagnose

1. Find the controllers and inspect the Pod owner. The owner is a ReplicaSet, which is itself owned by the Deployment.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get deployment m02
     kubectl --context kind-kv-lab -n kv-lab get replicasets -l app=m02
     kubectl --context kind-kv-lab -n kv-lab get pods -l app=m02 -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.metadata.ownerReferences[0].kind}{"/"}{.metadata.ownerReferences[0].name}{"\n"}{end}'
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Save the victim UID, delete the Pod, then wait for the replacement. The Deployment specification still asks for two replicas.

   ```bash
   (
     set -euo pipefail
     old=$(kubectl --context kind-kv-lab -n kv-lab get pods -l app=m02 -o jsonpath='{.items[0].metadata.name}')
     old_uid=$(kubectl --context kind-kv-lab -n kv-lab get pod "$old" -o jsonpath='{.metadata.uid}')
     kubectl --context kind-kv-lab -n kv-lab delete pod "$old" --wait=true
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m02 --timeout=180s
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod -l app=m02 --timeout=180s
     uids=$(kubectl --context kind-kv-lab -n kv-lab get pods -l app=m02 -o jsonpath='{.items[*].metadata.uid}')
     case " $uids " in *" $old_uid "*) echo 'Old Pod UID still present' >&2; false;; esac
   )
   ```

</details>

## Verify

1. Check the ready replica count and compare the current Pod names against your initial list.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get deployment m02 -o jsonpath='{.status.readyReplicas}')" = 2
     kubectl --context kind-kv-lab -n kv-lab get pods -l app=m02 -o wide
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Deployment controllers](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [ReplicaSets](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)
