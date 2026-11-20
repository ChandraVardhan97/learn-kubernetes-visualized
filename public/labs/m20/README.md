# M20 exercises

## Recover a stateless request path

Troubleshooting challenge

### Objective

Prove that an outage is in Service routing and restore the original client path.

### Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Work in m20. Preserve the Deployment and client as you repair Service m20-web.

**Initial state**

Deployment m20-web has two available replicas, but Service m20-web selects app=broken-selector. A client is ready to probe the Service.

**Expected results**

- The Service selector matches the existing workloads and has usable backends.
- m20-client can download the nginx response from the original Service name.

### Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Create the broken request path and wait for the healthy workload and its client.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f stateless.yaml
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m20-web --timeout=180s
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Ready pod/m20-client --timeout=180s
   )
   ```

### Diagnose

1. Compare Pod labels and Service configuration, then prove a failed request from the original client.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get pods -l app=m20-web --show-labels
     kubectl --context kind-kv-lab -n kv-lab get service m20-web -o yaml
     kubectl --context kind-kv-lab -n kv-lab get endpointslices -l kubernetes.io/service-name=m20-web
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec m20-client -- sh -c 'if wget -qO- -T 2 http://m20-web >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
       [ "$result" = HTTP_FAILED ] && break
       sleep 1
     done
     printf "%s\n" "$result"
     test "$result" = HTTP_FAILED
   )
   ```

### Solution

<details>
<summary>Reveal solution</summary>

1. Keep the Deployment in place and repair the Service selector.

   ```bash
   kubectl --context kind-kv-lab -n kv-lab patch service m20-web --type merge -p '{"spec":{"selector":{"app":"m20-web"}}}'
   ```

</details>

### Verify

1. Confirm the Deployment remains available and require a successful client request.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m20-web --timeout=90s
     result=
     for attempt in $(seq 1 30); do
       result=$(kubectl --context kind-kv-lab -n kv-lab exec m20-client -- sh -c 'if wget -qO- -T 2 http://m20-web >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1
       [ "$result" = HTTP_OK ] && break
       sleep 1
     done
     printf "%s\n" "$result"
     test "$result" = HTTP_OK
   )
   ```

### Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

### Official references

- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)

---

## Restore a deleted file and replace its Pod

Troubleshooting challenge

### Objective

Restore an external copy onto a persistent volume and independently compare bytes after Pod replacement.

### Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Work in m20. Use the default local-path provisioner and the same private backup directory throughout. The small fixture is a plain file.

**Initial state**

The starter writes a fixed 19-byte CSV to the mounted PVC, checks the private copy, and deletes the live file. The claim itself stays bound.

**Expected results**

- The restored file matches the backup before replacement.
- It still matches after the original Pod is replaced with a new consumer of the same claim.

### Setup

1. Create the claim, write and capture the known fixture in a private directory, and stop after the intentional file loss.

   ```bash
   bash capstone-stateful.sh start
   ```

### Diagnose

1. Inspect the binding, the empty mounted directory, and the size of the known backup.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get pvc m20
     kubectl --context kind-kv-lab -n kv-lab exec m20-data -- ls -la /data
     directory=$(python3 backup-path.py m20)
     wc -c < "$directory/orders.csv"
   )
   ```

### Solution

<details>
<summary>Reveal solution</summary>

1. Restore the backup with kubectl cp. The BusyBox image contains tar. The script compares bytes immediately after the copy.

   ```bash
   bash capstone-stateful.sh restore
   ```

2. Replace only the consuming Pod. It mounts the original PVC when it becomes Ready.

   ```bash
   bash capstone-stateful.sh replace
   ```

</details>

### Verify

1. Read the replacement Pod and compare byte counts and SHA-256 against the private backup.

   ```bash
   bash capstone-stateful.sh verify
   ```

### Clean up

1. Remove lab workloads and the teaching PVC. Retain the private backup only if you need it.

   ```bash
   bash cleanup.sh
   ```

### Official references

- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [kubectl cp](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_cp/)

---

## Enforce ownership and repair a controller-managed child

Guided exercise

### Objective

Separate declarative ownership of a custom resource from the controller that reconciles its children.

### Requirements & expected results

**Requirements**

- Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.
- Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.
- Work in m20. Use the local Python polling controller. Keep the shared WebApp CRD until finished with both m16 and m20.

**Initial state**

Field manager kv-gitops declares WebApp m20-platform. The reconciler creates the owned Deployment and ConfigMap, and a second manifest tries to change the declared spec.

**Expected results**

- The second manager receives a genuine field conflict, and unchanged reconciliation preserves the Deployment identity.
- The deleted child is repaired. Deleting the parent garbage-collects both children.

### Setup

1. Check that the shell targets the disposable lab cluster and create its namespace if needed.

   ```bash
   bash -c 'source ./_common.sh'
   ```

2. Install the API, create the parent as the declarative writer, and reconcile the children.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab apply -f crd.yaml
     kubectl --context kind-kv-lab -n kv-lab wait --for=condition=Established crd/webapps.labs.kv.example --timeout=60s
     kubectl --context kind-kv-lab -n kv-lab apply --server-side --field-manager=kv-gitops -f platform.yaml
     python3 operator.py --once
     kubectl --context kind-kv-lab -n kv-lab rollout status deployment/m20-platform --timeout=180s
   )
   ```

### Diagnose

1. Compare field managers on the parent and child, then require the declared spec conflict from kv-human.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab get webapp m20-platform -o yaml --show-managed-fields
     kubectl --context kind-kv-lab -n kv-lab get deployment m20-platform -o yaml --show-managed-fields
     if result=$(kubectl --context kind-kv-lab -n kv-lab apply --server-side --field-manager=kv-human -f platform-conflict.yaml 2>&1); then
       echo 'Expected an SSA field conflict' >&2; exit 1
     fi
     printf '%s\n' "$result" | grep -i conflict
   )
   ```

### Solution

<details>
<summary>Reveal solution</summary>

1. Keep the existing parent intent. Re-run the controller and verify that the Deployment keeps its identity.

   ```bash
   (
     set -euo pipefail
     before=$(kubectl --context kind-kv-lab -n kv-lab get deployment m20-platform -o jsonpath='{.metadata.uid}:{.metadata.generation}')
     python3 operator.py --iterations 2 --interval 1
     test "$(kubectl --context kind-kv-lab -n kv-lab get deployment m20-platform -o jsonpath='{.metadata.uid}:{.metadata.generation}')" = "$before"
   )
   ```

2. Delete the owned ConfigMap, run reconciliation, and verify that the child again contains the declared page. Then delete its owner.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab delete configmap m20-platform
     python3 operator.py --once
     test "$(kubectl --context kind-kv-lab -n kv-lab get configmap m20-platform -o jsonpath='{.data.index\.html}')" = gitops-declared-page
     kubectl --context kind-kv-lab -n kv-lab delete webapp m20-platform --wait=true
   )
   ```

</details>

### Verify

1. Wait for Kubernetes garbage collection to remove both dependents.

   ```bash
   (
     set -euo pipefail
     kubectl --context kind-kv-lab -n kv-lab wait --for=delete deployment/m20-platform --timeout=90s
     kubectl --context kind-kv-lab -n kv-lab wait --for=delete configmap/m20-platform --timeout=90s
   )
   ```

### Clean up

1. Remove the resources created by this exercise.

   ```bash
   bash cleanup.sh
   ```

### Official references

- [Server-Side Apply](https://kubernetes.io/docs/reference/using-api/server-side-apply/)
- [Garbage collection](https://kubernetes.io/docs/concepts/architecture/garbage-collection/)
