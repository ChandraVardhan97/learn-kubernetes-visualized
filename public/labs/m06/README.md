# Restore HTTP to a Service with no backends

Troubleshooting challenge

## Objective

Trace an HTTP failure from a client Pod to a Service selector and repair routing without changing the healthy web Deployment.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Run the commands from the m06 directory. The default kind DNS and Service dataplane are sufficient.

**Initial state**

The starter creates Deployment m06, Service m06, and Pod m06-client. It first confirms HTTP works, then changes the selector to app=no-match. The web Pods stay Ready and DNS still resolves.

**Expected results**

- Service m06 selects Pods labeled app=m06 and has at least one ready backend.
- A new HTTP request from m06-client receives the nginx page. The Deployment and client stay in place.

## Setup

1. Create the fixture and stop with DNS working and HTTP deliberately broken.

   ```bash
   bash start.sh
   ```

## Diagnose

1. Confirm the web Pods are ready and record their app label.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get deployment m06
     kubectl --context kind-kv-lab -n kv-lab get pods -l app=m06 --show-labels
   )
   ```

2. Compare the Service selector with the Pod labels. The EndpointSlice should have no ready backend.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get service m06 -o jsonpath='{.spec.selector}{"\n"}'
     kubectl --context kind-kv-lab -n kv-lab get endpointslices -l kubernetes.io/service-name=m06 -o yaml
   )
   ```

3. Resolve the Service name from the same client, then probe a new HTTP connection. Expect the DNS lookup and the command itself to succeed, with the HTTP probe reporting HTTP_FAILED.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab exec m06-client -- nslookup m06.kv-lab.svc.cluster.local
     kubectl --context kind-kv-lab -n kv-lab exec m06-client -- sh -c 'if wget -qO- -T 2 http://m06 >/dev/null; then echo HTTP_OK; else echo HTTP_FAILED; fi'
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. DNS resolves the Service name to its stable address. The selector determines which Pod addresses can serve traffic. Change the selector to match the existing web Pods.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab patch service m06 --type merge -p '{"spec":{"selector":{"app":"m06"}}}'
   ```

2. Use Verify in the Run, inspect & clean up section. EndpointSlice and dataplane updates can take a moment to converge.

</details>

## Verify

1. Wait for a ready backend and a successful request from m06-client.

   ```bash
   bash verify.sh
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
- [EndpointSlices](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
