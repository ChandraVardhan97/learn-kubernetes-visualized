# Restore one client path through a NetworkPolicy

Troubleshooting challenge

## Objective

Use observed HTTP traffic and Pod labels to reason about a deny policy, then allow the intended client.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Use the pinned kind networking configuration. A functioning policy implementation is necessary for the deny test.

**Initial state**

Setup confirms a working HTTP path from m08-client to m08, applies deny.yaml, and waits for a new request to fail.

**Expected results**

- The labeled client succeeds after applying the narrow allow rule.
- The deny policy remains in place and the allow policy names the intended client through its selector.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Confirm the baseline succeeds before applying the deny policy.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m08 --timeout=180s
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m08-client --timeout=180s
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec m08-client -- sh -c 'if wget -qO- -T 2 http://m08 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
       [ "$result" = HTTP_OK ] && break
       sleep 1
     done
     printf "%s\n" "$result"
     test "$result" = HTTP_OK
     kubectl --context kind-kv-lab -n kv-lab apply -f deny.yaml
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec m08-client -- sh -c 'if wget -qO- -T 2 http://m08 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
       [ "$result" = HTTP_FAILED ] && break
       sleep 1
     done
     printf "%s\n" "$result"
     test "$result" = HTTP_FAILED
   )
   ```

## Diagnose

1. Inspect the two workloads, the deny policy, and the ready Service backends. Then confirm a fresh request now fails.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get pods -l lab=m08 --show-labels
     kubectl --context kind-kv-lab -n kv-lab get networkpolicy -l lab=m08 -o yaml
     kubectl --context kind-kv-lab -n kv-lab get endpointslices -l kubernetes.io/service-name=m08
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec m08-client -- sh -c 'if wget -qO- -T 2 http://m08 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
       [ "$result" = HTTP_FAILED ] && break
       sleep 1
     done
     printf "%s\n" "$result"
     test "$result" = HTTP_FAILED
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Apply the allow policy. Policies are additive, so this grants the selected client access without deleting the deny policy.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab apply -f allow.yaml
   ```

</details>

## Verify

1. Check both policies and make a new HTTP request from the same client.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get -f deny.yaml -f allow.yaml
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec m08-client -- sh -c 'if wget -qO- -T 2 http://m08 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
       [ "$result" = HTTP_OK ] && break
       sleep 1
     done
     printf "%s\n" "$result"
     test "$result" = HTTP_OK
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
