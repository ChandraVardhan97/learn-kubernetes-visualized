# Fix a Service that targets the wrong port

Troubleshooting challenge

## Objective

Distinguish a backend port mismatch from a selector or readiness problem.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Work in p01. Preserve the nginx listener, ready Pods, and Service port 80.

**Initial state**

The Service selects a ready backend but sends connections to port 81. nginx listens on port 80.

**Expected results**

- Traffic to the same Service port works after the targetPort is corrected.
- The original selector and Pod remain unchanged.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Create the workload, Service and probe client.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/p01 --timeout=180s
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/p01-client --timeout=180s
   )
   ```

## Diagnose

1. Check the resolved EndpointSlice port and confirm the actual listener works inside the web Pod. Compare with a failed Service request.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get pods -l app=p01 --show-labels
     kubectl --context kind-kv-lab -n kv-lab get service p01 -o yaml
     kubectl --context kind-kv-lab -n kv-lab get endpointslices -l kubernetes.io/service-name=p01 -o yaml
     kubectl --context kind-kv-lab -n kv-lab exec deployment/p01 -- wget -qO- -T 2 http://127.0.0.1:80
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec p01-client -- sh -c 'if wget -qO- -T 2 http://p01 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
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

1. Keep the client-facing port and set the backend target port to the actual listener.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab patch service p01 --type merge -p '{"spec":{"ports":[{"port":80,"targetPort":80}]}}'
   ```

</details>

## Verify

1. Check the original selector and correct port, then require an HTTP response.

   ```bash
   (
     set -euo pipefail
     test "$(kubectl --context kind-kv-lab -n kv-lab get service p01 -o jsonpath='{.spec.selector.app}:{.spec.ports[0].targetPort}')" = p01:80
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec p01-client -- sh -c 'if wget -qO- -T 2 http://p01 >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
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

- [Service port definitions](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
