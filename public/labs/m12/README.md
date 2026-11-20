# Separate a crashing process from a routing fault

Troubleshooting challenge

## Objective

Use logs and Service evidence to identify two independent failures, then restore routing to healthy Pods.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Keep m12-crash in its deliberate failed state. Fix only the Service.

**Initial state**

m12-crash exits because required config is missing. Deployment m12 is healthy, but Service m12 uses a selector that matches none of its Pods.

**Expected results**

- You can identify the configuration fault from the crash logs.
- Service m12 routes traffic to the healthy Deployment while the separate crash fixture is untouched.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Create the independent crash and routing fixtures.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m12 --timeout=180s
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m12-client --timeout=180s
   )
   ```

## Diagnose

1. Wait for the process to emit the deliberate configuration error. Use the Pod description to inspect its restart and last exit state.

   ```bash
   (
     set -euo pipefail
     logs=
     for attempt in $(seq 1 45); do
       logs=$(kubectl --context kind-kv-lab -n kv-lab logs m12-crash 2>/dev/null) || true
       [[ "$logs" = *'fatal: missing required config'* ]] && break
       sleep 1
     done
     printf '%s\n' "$logs"
     [[ "$logs" = *'fatal: missing required config'* ]]
     kubectl --context kind-kv-lab -n kv-lab describe pod m12-crash
   )
   ```

2. Compare healthy web Pod labels, Service selector, EndpointSlices and a failing client request.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get pods -l app=m12 --show-labels
     kubectl --context kind-kv-lab -n kv-lab get service m12 -o yaml
     kubectl --context kind-kv-lab -n kv-lab get endpointslices -l kubernetes.io/service-name=m12 -o yaml
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec m12-client -- sh -c 'if wget -qO- -T 2 http://m12 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
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

1. Match the Service selector to the web Pods. The unrelated crash does not explain why the Service selected no backends.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab patch service m12 --type merge -p '{"spec":{"selector":{"app":"m12"}}}'
   ```

</details>

## Verify

1. Require success from the original client and confirm that a separate crash fixture still exists.

   ```bash
   (
     set -euo pipefail
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec m12-client -- sh -c 'if wget -qO- -T 2 http://m12 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
       [ "$result" = HTTP_OK ] && break
       sleep 1
     done
     printf "%s\n" "$result"
     test "$result" = HTTP_OK
     kubectl --context kind-kv-lab -n kv-lab get pod m12-crash
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Debug Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/)
- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
