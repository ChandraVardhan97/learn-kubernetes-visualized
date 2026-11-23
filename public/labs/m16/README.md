# Reconcile a WebApp and repair a deleted child

Guided exercise

## Objective

Install a custom API and use a small polling reconciler to bring its owned objects back to the declared state.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Python 3 runs the reconciler locally with your lab kubeconfig. Leave the shared WebApp CRD installed until you finish m16 and m20.

**Initial state**

The WebApp CRD is established and WebApp m16 declares one replica. The reconciler has yet to create any children.

**Expected results**

- The WebApp owns the Deployment and ConfigMap. Repeated reconciliation keeps the Deployment identity stable.
- Deleting the ConfigMap is repaired, and declaring two replicas results in two ready Pods.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Install the CRD, wait for it to be established, then create the custom resource.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f crd.yaml
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Established crd/webapps.labs.kv.example --timeout=60s
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
   )
   ```

## Diagnose

1. Read the custom-resource spec and inspect which children exist before running the reconciler.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get webapp m16 -o yaml
     kubectl --context kind-kv-lab -n kv-lab get deployment,configmap -l lab=m16
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Run the reconciler, check the owner reference, then re-run it and verify the Deployment UID and generation are stable.

   ```bash
   (
     set -euo pipefail
     python3 webapp-reconciler.py --once
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m16 --timeout=180s
     before=$(kubectl --context kind-kv-lab -n kv-lab get deployment m16 -o jsonpath='{.metadata.uid}:{.metadata.generation}')
     python3 webapp-reconciler.py --iterations 2 --interval 1
     test "$(kubectl --context kind-kv-lab -n kv-lab get deployment m16 -o jsonpath='{.metadata.uid}:{.metadata.generation}')" = "$before"
     test "$(kubectl --context kind-kv-lab -n kv-lab get deployment m16 -o jsonpath='{.metadata.ownerReferences[0].uid}')" = "$(kubectl --context kind-kv-lab -n kv-lab get webapp m16 -o jsonpath='{.metadata.uid}')"
   )
   ```

2. Delete the owned ConfigMap and declare two replicas on the parent. Run a reconciliation pass to repair the child and update the Deployment.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab delete configmap m16
     kubectl --context kind-kv-lab -n kv-lab patch webapp m16 --type merge -p '{"spec":{"replicas":2}}'
     python3 webapp-reconciler.py --once
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m16 --timeout=180s
   )
   ```

</details>

## Verify

1. Confirm that the ConfigMap was recreated with the right owner and two replicas are Ready.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get configmap m16 -o jsonpath='{.metadata.ownerReferences[0].uid}')" = "$(kubectl --context kind-kv-lab -n kv-lab get webapp m16 -o jsonpath='{.metadata.uid}')"
     test "$(kubectl --context kind-kv-lab -n kv-lab get deployment m16 -o jsonpath='{.status.readyReplicas}')" = 2
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Custom resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
- [Owners and dependents](https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/)
