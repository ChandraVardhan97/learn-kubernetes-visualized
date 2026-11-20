# Grant a ServiceAccount one cross-namespace read

Troubleshooting challenge

## Objective

Use namespaced RBAC to allow access to one ConfigMap while keeping unrelated requests denied.

## Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Work in p04 using credentials that can impersonate the teaching ServiceAccount. Reserve namespace kv-lab-p04-target for this exercise.

**Initial state**

ServiceAccount p04-reader has a ConfigMap read RoleBinding in kv-lab. The target ConfigMap is in a second namespace with no binding for this account.

**Expected results**

- The intended ConfigMap read in the target namespace succeeds.
- The same account is still denied ConfigMap writes, other ConfigMap reads in the target namespace, and Secret reads.

## Setup

1. Create the teaching account, home binding and the second namespace.

   ```bash
   bash start.sh
   ```

## Diagnose

1. Compare the same read permission across namespaces.

   ```bash
   (
     set -euo pipefail
     identity=system:serviceaccount:kv-lab:p04-reader
     test "$(kubectl --context kind-kv-lab -n kv-lab auth can-i get configmaps --as="$identity")" = yes
     test "$(kubectl --context kind-kv-lab -n kv-lab-p04-target auth can-i get configmaps/p04-status --as="$identity")" = no
     kubectl --context kind-kv-lab -n kv-lab get rolebinding p04-reader -o yaml
   )
   ```

## Solution

<details>
<summary>Reveal solution</summary>

1. In the target namespace, grant get only for the named ConfigMap, and bind that Role to the account in kv-lab.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab-p04-target create role p04-status-reader --verb=get --resource=configmaps --resource-name=p04-status
     kubectl --context kind-kv-lab -n kv-lab-p04-target create rolebinding p04-status-reader --role=p04-status-reader --serviceaccount=kv-lab:p04-reader
   )
   ```

</details>

## Verify

1. Read the actual ConfigMap as the account, then assert the deny boundaries.

   ```bash
   (
     set -euo pipefail
     identity=system:serviceaccount:kv-lab:p04-reader
     test "$(kubectl --context kind-kv-lab -n kv-lab-p04-target get cm p04-status --as="$identity" -o jsonpath='{.data.environment}')" = teaching
     test "$(kubectl --context kind-kv-lab -n kv-lab-p04-target auth can-i get configmaps/another --as="$identity")" = no
     test "$(kubectl --context kind-kv-lab -n kv-lab-p04-target auth can-i update configmaps/p04-status --as="$identity")" = no
     test "$(kubectl --context kind-kv-lab -n kv-lab-p04-target auth can-i get secrets --as="$identity")" = no
   )
   ```

## Clean up

1. Remove the home binding and the lab-owned target namespace.

   ```bash
   bash cleanup.sh
   ```

## Official references

- [RBAC RoleBindings and resource names](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
