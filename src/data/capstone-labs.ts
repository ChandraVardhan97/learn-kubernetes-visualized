import { cleanup, docs, shell as s, start, step, waitForHttp, type Exercise } from './lab-format';

export const capstoneLabs: Exercise[] = [
  {
    id: 'm20-stateless', title: 'Recover a stateless request path',
    kind: 'challenge',
    objective: 'Prove that an outage is in Service routing and restore the original client path.',
    requirements: ['Work in m20. Preserve the Deployment and client as you repair Service m20-web.'],
    initial: 'Deployment m20-web has two available replicas, but Service m20-web selects app=broken-selector. A client is ready to probe the Service.',
    expected: ['The Service selector matches the existing workloads and has usable backends.', 'm20-client can download the nginx response from the original Service name.'],
    setup: [start, s('Create the broken request path and wait for the healthy workload and its client.', '@k apply -f stateless.yaml\n@k rollout status deployment/m20-web --timeout=180s\n@k wait --for=condition=Ready pod/m20-client --timeout=180s')],
    diagnose: [s('Compare Pod labels and Service configuration, then prove a failed request from the original client.', '@k get pods -l app=m20-web --show-labels\n@k get service m20-web -o yaml\n@k get endpointslices -l kubernetes.io/service-name=m20-web\n' + waitForHttp('m20-client', 'http://m20-web', 'HTTP_FAILED'))],
    solution: [s('Keep the Deployment in place and repair the Service selector.', "@k patch service m20-web --type merge -p '{\"spec\":{\"selector\":{\"app\":\"m20-web\"}}}'")],
    verify: [s('Confirm the Deployment remains available and require a successful client request.', '@k rollout status deployment/m20-web --timeout=90s\n' + waitForHttp('m20-client', 'http://m20-web', 'HTTP_OK'))],
    cleanup, sources: [docs('Debug Services', 'tasks/debug/debug-application/debug-service')],
  },
  {
    id: 'm20-stateful', title: 'Restore a deleted file and replace its Pod',
    kind: 'challenge',
    objective: 'Restore an external copy onto a persistent volume and independently compare bytes after Pod replacement.',
    requirements: ['Work in m20. Use the default local-path provisioner and the same private backup directory throughout. The small fixture is a plain file.'],
    initial: 'The starter writes a fixed 19-byte CSV to the mounted PVC, checks the private copy, and deletes the live file. The claim itself stays bound.',
    expected: ['The restored file matches the backup before replacement.', 'It still matches after the original Pod is replaced with a new consumer of the same claim.'],
    setup: [step('Create the claim, write and capture the known fixture in a private directory, and stop after the intentional file loss.', 'bash capstone-stateful.sh start')],
    diagnose: [s('Inspect the binding, the empty mounted directory, and the size of the known backup.', '@k get pvc m20\n@k exec m20-data -- ls -la /data\ndirectory=$(python3 backup-path.py m20)\nwc -c < "$directory/orders.csv"')],
    solution: [
      step('Restore the backup with kubectl cp. The BusyBox image contains tar. The script compares bytes immediately after the copy.', 'bash capstone-stateful.sh restore'),
      step('Replace only the consuming Pod. It mounts the original PVC when it becomes Ready.', 'bash capstone-stateful.sh replace'),
    ],
    verify: [step('Read the replacement Pod and compare byte counts and SHA-256 against the private backup.', 'bash capstone-stateful.sh verify')],
    cleanup: [step('Remove lab workloads and the teaching PVC. Retain the private backup only if you need it.', 'bash cleanup.sh')],
    sources: [docs('Persistent Volumes', 'concepts/storage/persistent-volumes'), docs('kubectl cp', 'reference/kubectl/generated/kubectl_cp')],
  },
  {
    id: 'm20-platform', title: 'Enforce ownership and repair a controller-managed child',
    objective: 'Separate declarative ownership of a custom resource from the controller that reconciles its children.',
    requirements: ['Work in m20. Use the local Python polling controller. Keep the shared WebApp CRD until finished with both m16 and m20.'],
    initial: 'Field manager kv-gitops declares WebApp m20-platform. The reconciler creates the owned Deployment and ConfigMap, and a second manifest tries to change the declared spec.',
    expected: ['The second manager receives a genuine field conflict, and unchanged reconciliation preserves the Deployment identity.', 'The deleted child is repaired. Deleting the parent garbage-collects both children.'],
    setup: [start, s('Install the API, create the parent as the declarative writer, and reconcile the children.', '@k apply -f crd.yaml\n@k wait --for=condition=Established crd/webapps.labs.kv.example --timeout=60s\n@k apply --server-side --field-manager=kv-gitops -f platform.yaml\npython3 operator.py --once\n@k rollout status deployment/m20-platform --timeout=180s')],
    diagnose: [s('Compare field managers on the parent and child, then require the declared spec conflict from kv-human.', "@k get webapp m20-platform -o yaml --show-managed-fields\n@k get deployment m20-platform -o yaml --show-managed-fields\nif result=$(@k apply --server-side --field-manager=kv-human -f platform-conflict.yaml 2>&1); then\n  echo 'Expected an SSA field conflict' >&2; exit 1\nfi\nprintf '%s\\n' \"$result\" | grep -i conflict")],
    solution: [
      s('Keep the existing parent intent. Re-run the controller and verify that the Deployment keeps its identity.', "before=$(@k get deployment m20-platform -o jsonpath='{.metadata.uid}:{.metadata.generation}')\npython3 operator.py --iterations 2 --interval 1\ntest \"$(@k get deployment m20-platform -o jsonpath='{.metadata.uid}:{.metadata.generation}')\" = \"$before\""),
      s('Delete the owned ConfigMap, run reconciliation, and verify that the child again contains the declared page. Then delete its owner.', "@k delete configmap m20-platform\npython3 operator.py --once\ntest \"$(@k get configmap m20-platform -o jsonpath='{.data.index\\.html}')\" = gitops-declared-page\n@k delete webapp m20-platform --wait=true"),
    ],
    verify: [s('Wait for Kubernetes garbage collection to remove both dependents.', '@k wait --for=delete deployment/m20-platform --timeout=90s\n@k wait --for=delete configmap/m20-platform --timeout=90s')],
    cleanup, sources: [docs('Server-Side Apply', 'reference/using-api/server-side-apply'), docs('Garbage collection', 'concepts/architecture/garbage-collection')],
  },
];
