# Demonstrate a least-privilege ServiceAccount

Guided exercise

## Objective

Read the Role and its binding, prove the allowed and denied actions, and inspect security settings on the Pod.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- The disposable kind administrator must be able to impersonate the exercise ServiceAccount.

**Initial state**

Setup makes a reader Role and a RoleBinding for m11-reader, then starts a restricted Pod that uses the ServiceAccount without an automatic token mount.

**Expected results**

- The account can list Pods in kv-lab and is denied a Secret read.
- The process runs as UID 1000 and the Pod has automatic token mounting disabled.

## Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Create the ServiceAccount, Role, RoleBinding and Pod.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f resources.yaml
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m11 --timeout=180s
   )
   ```

## Diagnose

1. Inspect the binding subject and the actions allowed by the referenced Role.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get role m11-reader -o yaml
     kubectl --context kind-kv-lab -n kv-lab get rolebinding m11-reader -o yaml
     kubectl --context kind-kv-lab -n kv-lab get pod m11 -o yaml
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. The binding grants the account listed in its subject the namespaced verbs from the Role. Kubernetes authorizes the API action independently from the UID and capabilities inside the container.

</details>

## Verify

1. Impersonate the account for allow and deny checks. Then inspect the running container UID and token-mount setting.

   ```bash
   (
     set -euo pipefail
     identity=system:serviceaccount:kv-lab:m11-reader
     test "$(kubectl --context kind-kv-lab -n kv-lab auth can-i list pods --as="$identity")" = yes
     test "$(kubectl --context kind-kv-lab -n kv-lab auth can-i get secrets --as="$identity")" = no
     test "$(kubectl --context kind-kv-lab -n kv-lab exec m11 -- id -u)" = 1000
     test "$(kubectl --context kind-kv-lab -n kv-lab get pod m11 -o jsonpath='{.spec.automountServiceAccountToken}')" = false
   )
   ```

## Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [RBAC authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Security contexts](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)
