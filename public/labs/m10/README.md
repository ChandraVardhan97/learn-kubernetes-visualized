# Compare identity, node coverage, and completion

Guided exercise

## Objective

Read the status of a StatefulSet, DaemonSet, Job, suspended CronJob, and disruption budget.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Use the regular three-node topology. Leave the nodes schedulable and the CronJob suspended.

**Initial state**

The runner creates one StatefulSet replica, a DaemonSet, a short-lived Job, a suspended CronJob and a PodDisruptionBudget.

**Expected results**

- StatefulSet m10 has a Ready m10-0 Pod. DaemonSet m10-agent has a Ready agent on each eligible node.
- Job m10-job completes and the suspended CronJob does not create a scheduled run.

## Setup

1. Create the workload controllers and wait for the StatefulSet and Job.

   ```bash
   bash run.sh
   ```

## Diagnose

1. Inspect the stable ordinal and the DaemonSet node placement, then read the Job result and scheduled workload state.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get pod m10-0 -o wide
     kubectl --context kind-kv-lab -n kv-lab get daemonset m10-agent
     kubectl --context kind-kv-lab -n kv-lab get pods -l app=m10-agent -o wide
     kubectl --context kind-kv-lab -n kv-lab logs job/m10-job
     kubectl --context kind-kv-lab -n kv-lab get cronjob m10-schedule
     kubectl --context kind-kv-lab -n kv-lab describe pdb m10
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Read identity from the StatefulSet ordinal, coverage from the DaemonSet desired count, and success from the Job Complete condition. The suspended CronJob holds a schedule for future Jobs. A disruption budget governs voluntary disruptions to matching Pods.

</details>

## Verify

1. Check the distinct controller signals.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m10-0 --timeout=90s
     kubectl --context kind-kv-lab -n kv-lab rollout status daemonset/m10-agent --timeout=90s
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Complete job/m10-job --timeout=90s
     test "$(kubectl --context kind-kv-lab -n kv-lab get cronjob m10-schedule -o jsonpath='{.spec.suspend}')" = true
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Workload management](https://kubernetes.io/docs/concepts/workloads/controllers/)
- [Disruptions](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
