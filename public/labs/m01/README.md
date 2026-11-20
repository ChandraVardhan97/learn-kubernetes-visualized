# Compare a container process and a Pod

Guided exercise

## Objective

Run a standalone process and a Kubernetes Pod, then identify which address and port actually served an HTTP request.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Docker must be running and able to pull the BusyBox and nginx teaching images.

**Initial state**

There is no m01 Pod. The Docker command starts a short-lived BusyBox process, while resources.yaml declares a separate nginx Pod.

**Expected results**

- The standalone process prints its hostname and user ID, then exits.
- Pod m01 gets an IP and the nginx server answers on port 80 inside the Pod.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Run a standalone container and create the separate Kubernetes Pod.

   ```bash
   (
     set -euo pipefail
     docker run --rm --name kv-lab-m01-process busybox:1.37.0 sh -c 'hostname; id; echo process-complete'
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m01 --timeout=180s
   )
   ```

## Diagnose

1. Inspect the Pod IP, node, image and container state. The Pod is the object declared by resources.yaml.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get pod m01 -o wide
     kubectl --context kind-kv-lab -n kv-lab describe pod m01
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. Use exec to make a request inside the Pod network namespace. Here 127.0.0.1 refers to the Pod itself.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab exec m01 -- wget -qO- -T 3 http://127.0.0.1:80
   ```

</details>

## Verify

1. Confirm the Pod has an IP and returns the stock nginx HTML.

   ```bash
   (
     set -euo pipefail
     test -n "$(kubectl --context kind-kv-lab -n kv-lab get pod m01 -o jsonpath='{.status.podIP}')"
     kubectl --context kind-kv-lab -n kv-lab exec m01 -- wget -qO- -T 3 http://127.0.0.1:80 | grep -F 'Welcome to nginx!'
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [Pods](https://kubernetes.io/docs/concepts/workloads/pods/)
