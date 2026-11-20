# Remove a ready backend without restarting it

Guided exercise

## Objective

Observe how a readiness failure updates EndpointSlices, then restore readiness and roll back a Pod template change.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Give probe and EndpointSlice updates time to converge. The lab intentionally changes one of two web Pods.

**Initial state**

Deployment m05 is available, and both Pods initially satisfy the readiness probe because /tmp/ready exists.

**Expected results**

- One Pod becomes unready and its EndpointSlice entry reports ready=false while its restart count stays stable.
- Restoring the sentinel returns the Pod to Ready. A separate template edit creates a rollout that you can undo.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Apply the Deployment and Service and wait for two available replicas.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m05 --timeout=180s
   )
   ```

## Diagnose

1. Read the readiness probe and see the backend conditions before making a change.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get deployment m05 -o yaml
     kubectl --context kind-kv-lab -n kv-lab get endpointslices -l kubernetes.io/service-name=m05 -o yaml
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Remove the sentinel from one Pod, wait for Ready=false, and check that the restart count stays the same.

   ```bash
   (
     set -euo pipefail
     pod=$(kubectl --context kind-kv-lab -n kv-lab get pods -l app=m05 -o jsonpath='{.items[0].metadata.name}')
     before=$(kubectl --context kind-kv-lab -n kv-lab get pod "$pod" -o jsonpath='{.status.containerStatuses[0].restartCount}')
     kubectl --context kind-kv-lab -n kv-lab exec "$pod" -- rm /tmp/ready
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready=false "pod/$pod" --timeout=60s
     kubectl --context kind-kv-lab -n kv-lab wait --for="jsonpath={.endpoints[?(@.targetRef.name==\"$pod\")].conditions.ready}=false" endpointslice -l kubernetes.io/service-name=m05 --timeout=60s
     test "$(kubectl --context kind-kv-lab -n kv-lab get pod "$pod" -o jsonpath='{.status.containerStatuses[0].restartCount}')" = "$before"
     kubectl --context kind-kv-lab -n kv-lab get endpointslices -l kubernetes.io/service-name=m05 -o yaml
     kubectl --context kind-kv-lab -n kv-lab exec "$pod" -- touch /tmp/ready
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready "pod/$pod" --timeout=60s
   )
   ```

2. Edit the Pod template, wait for the rollout, and then undo it. The template edit changes the revision.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab patch deployment m05 --type merge -p '{"spec":{"template":{"metadata":{"annotations":{"release":"two"}}}}}'
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m05 --timeout=180s
     kubectl --context kind-kv-lab -n kv-lab rollout history deployment/m05
     kubectl --context kind-kv-lab -n kv-lab rollout undo deployment/m05
   )
   ```

</details>

## Verify

1. Confirm the Deployment is available and undo removed the release annotation.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m05 --timeout=180s
     test "$(kubectl --context kind-kv-lab -n kv-lab get deployment m05 -o jsonpath='{.status.readyReplicas}')" = 2
     test -z "$(kubectl --context kind-kv-lab -n kv-lab get deployment m05 -o jsonpath='{.spec.template.metadata.annotations.release}')"
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Container probes](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Deployment rollback](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
