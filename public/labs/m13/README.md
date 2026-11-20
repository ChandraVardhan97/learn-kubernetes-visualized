# Render Kustomize and diagnose unavailable HPA metrics

Guided exercise

## Objective

Inspect the generated configuration and determine why the baseline HPA cannot calculate CPU utilization.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- The default kind profile has no Metrics Server. Leave it uninstalled to reproduce the expected condition.

**Initial state**

The local Kustomization declares two replicas and generates a ConfigMap. Applying it creates a CPU-target HPA and its target Deployment.

**Expected results**

- The rendered configuration contains a generated ConfigMap and two replicas.
- The HPA target resolves, but ScalingActive=False reports FailedGetResourceMetric.

## Setup

1. Render and apply the Kustomization, then wait for the target Deployment.

   ```bash
   bash run.sh
   ```

## Diagnose

1. Inspect the rendered YAML, the target Deployment CPU requests and the HPA conditions. The generated ConfigMap is not mounted by this Deployment.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab kustomize .
     kubectl --context kind-kv-lab -n kv-lab get deployment m13 -o yaml
     kubectl --context kind-kv-lab -n kv-lab describe hpa m13
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. The HPA needs resource metrics from the metrics API to compute observed CPU utilization. It uses the declared CPU requests when metrics arrive. Here the expected outcome is diagnosing missing metrics; the exercise does not require traffic generation or a scaling event.

</details>

## Verify

1. Wait for the metrics failure reason and confirm that the target Deployment remains available.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab wait --for='jsonpath={.status.conditions[?(@.type=="ScalingActive")].reason}=FailedGetResourceMetric' hpa/m13 --timeout=90s
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m13 --timeout=90s
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Kustomize](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/)
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
