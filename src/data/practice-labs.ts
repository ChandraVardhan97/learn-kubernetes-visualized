import { cleanup, docs, shell as s, start, step, waitForHttp, type Exercise, type Lab } from './lab-format';

function practice(exercise: Exercise, moduleId: string, files: string[]): Lab {
  return { id: exercise.id, moduleId, files: ['README.md', '_common.sh', 'cleanup.sh', ...files], exercises: [{ ...exercise, kind: 'challenge' }] };
}

export const practiceLabs: Lab[] = [
  practice({
    id: 'p01', title: 'Fix a Service that targets the wrong port',
    objective: 'Distinguish a backend port mismatch from a selector or readiness problem.',
    requirements: ['Work in p01. Preserve the nginx listener, ready Pods, and Service port 80.'],
    initial: 'The Service selects a ready backend but sends connections to port 81. nginx listens on port 80.',
    expected: ['Traffic to the same Service port works after the targetPort is corrected.', 'The original selector and Pod remain unchanged.'],
    setup: [start, s('Create the workload, Service and probe client.', '@k apply -f resources.yaml\n@k rollout status deployment/p01 --timeout=180s\n@k wait --for=condition=Ready pod/p01-client --timeout=180s')],
    diagnose: [s('Check the resolved EndpointSlice port and confirm the actual listener works inside the web Pod. Compare with a failed Service request.', '@k get pods -l app=p01 --show-labels\n@k get service p01 -o yaml\n@k get endpointslices -l kubernetes.io/service-name=p01 -o yaml\n@k exec deployment/p01 -- wget -qO- -T 2 http://127.0.0.1:80\n' + waitForHttp('p01-client','http://p01','HTTP_FAILED'))],
    solution: [s('Keep the client-facing port and set the backend target port to the actual listener.', "@k patch service p01 --type merge -p '{\"spec\":{\"ports\":[{\"port\":80,\"targetPort\":80}]}}'")],
    verify: [s('Check the original selector and correct port, then require an HTTP response.', "test \"$(@k get service p01 -o jsonpath='{.spec.selector.app}:{.spec.ports[0].targetPort}')\" = p01:80\n" + waitForHttp('p01-client','http://p01','HTTP_OK'))],
    cleanup, sources: [docs('Service port definitions', 'concepts/services-networking/service'), docs('Debug Services', 'tasks/debug/debug-application/debug-service')],
  }, 'm06', ['resources.yaml']),
  practice({
    id: 'p02', title: 'Place a Pod on a tainted worker',
    objective: 'Read scheduler evidence and allow one designated Pod onto a reserved worker with a narrowly matching toleration.',
    requirements: ['Work in p02. The default worker kv-lab-worker must exist. Leave its teaching taint in place while solving.'],
    initial: 'The starter taints kv-lab-worker with labs.kv.example/p02=reserved:NoSchedule. Pod p02 selects that worker and remains Pending.',
    expected: ['The original Pod tolerates exactly the teaching taint and is assigned to kv-lab-worker.', 'Cleanup removes the annotation and taint added by the starter.'],
    setup: [step('Create the lab-owned taint and pending fixture.', 'bash start.sh')],
    diagnose: [s('Compare the worker taint with the Pod constraints and the FailedScheduling event.', '@k describe pod p02\n@cluster describe node kv-lab-worker')],
    solution: [s('Append a toleration for the key, value and effect, leaving the default tolerations intact. Keep nodeSelector because a toleration permits placement but does not choose a node.', "@k patch pod p02 --type json -p '[{\"op\":\"add\",\"path\":\"/spec/tolerations/-\",\"value\":{\"key\":\"labs.kv.example/p02\",\"operator\":\"Equal\",\"value\":\"reserved\",\"effect\":\"NoSchedule\"}}]'")],
    verify: [s('Wait for readiness and read the assigned node.', "@k wait --for=condition=Ready pod/p02 --timeout=180s\ntest \"$(@k get pod p02 -o jsonpath='{.spec.nodeName}')\" = kv-lab-worker")],
    cleanup: [step('Remove the Pod and the worker metadata owned by this exercise.', 'bash cleanup.sh')],
    sources: [docs('Taints and Tolerations', 'concepts/scheduling-eviction/taint-and-toleration')],
  }, 'm07', ['resources.yaml', 'start.sh']),
  practice({
    id: 'p03', title: 'Bind a PVC with the intended StorageClass',
    objective: 'Trace why a claim cannot be provisioned, then bind a clean teaching claim without modifying the provisioner.',
    requirements: ['Work in p03 and keep the kind local-path StorageClass. Only replace the unbound teaching claim.'],
    initial: 'PVC p03 explicitly names p03-missing, which the cluster does not provide. Its consumer waits for storage.',
    expected: ['The replacement claim uses standard and becomes Bound.', 'The consuming Pod reads a file it wrote to the mounted directory.'],
    setup: [start, s('Apply the claim and its consumer.', '@k apply -f claim.yaml -f consumer.yaml')],
    diagnose: [s('Compare the requested class with the available ones. Inspect the storage and scheduling events.', '@cluster get storageclass\n@k describe pvc p03\n@k describe pod p03')],
    solution: [s('Confirm the claim is Pending and has no assigned PV. Recreate the teaching claim with standard and let the existing consumer trigger provisioning.', "if [ \"$(@k get pvc p03 -o jsonpath='{.status.phase}:{.spec.volumeName}')\" != Pending: ]; then\n  echo 'Refusing to replace a claim that is not Pending and unbound.' >&2\n  false\nelse\n  @k delete pvc p03 --wait=false &&\n  @k delete pod p03 --wait=true &&\n  @k wait --for=delete pvc/p03 --timeout=60s &&\n  sed 's/storageClassName: p03-missing/storageClassName: standard/' claim.yaml | @k apply -f - &&\n  @k apply -f consumer.yaml &&\n  @k wait --for=condition=Ready pod/p03 --timeout=180s &&\n  @k exec p03 -- sh -c 'echo storage-ready > /data/marker'\nfi")],
    verify: [s('Wait for the mount, confirm the claim is bound and read back a marker.', "@k wait --for=condition=Ready pod/p03 --timeout=180s\ntest \"$(@k get pvc p03 -o jsonpath='{.spec.storageClassName}:{.status.phase}')\" = standard:Bound\ntest \"$(@k exec p03 -- cat /data/marker)\" = storage-ready")],
    cleanup, sources: [docs('StorageClasses', 'concepts/storage/storage-classes'), docs('Persistent Volumes', 'concepts/storage/persistent-volumes')],
  }, 'm09', ['claim.yaml', 'consumer.yaml']),
  practice({
    id: 'p04', title: 'Grant a ServiceAccount one cross-namespace read',
    objective: 'Use namespaced RBAC to allow access to one ConfigMap while keeping unrelated requests denied.',
    requirements: ['Work in p04 using credentials that can impersonate the teaching ServiceAccount. Reserve namespace kv-lab-p04-target for this exercise.'],
    initial: 'ServiceAccount p04-reader has a ConfigMap read RoleBinding in kv-lab. The target ConfigMap is in a second namespace with no binding for this account.',
    expected: ['The intended ConfigMap read in the target namespace succeeds.', 'The same account is still denied ConfigMap writes, other ConfigMap reads in the target namespace, and Secret reads.'],
    setup: [step('Create the teaching account, home binding and the second namespace.', 'bash start.sh')],
    diagnose: [s('Compare the same read permission across namespaces.', "identity=system:serviceaccount:kv-lab:p04-reader\ntest \"$(@k auth can-i get configmaps --as=\"$identity\")\" = yes\ntest \"$(@cluster -n kv-lab-p04-target auth can-i get configmaps/p04-status --as=\"$identity\")\" = no\n@k get rolebinding p04-reader -o yaml")],
    solution: [s('In the target namespace, grant get only for the named ConfigMap, and bind that Role to the account in kv-lab.', '@cluster -n kv-lab-p04-target create role p04-status-reader --verb=get --resource=configmaps --resource-name=p04-status\n@cluster -n kv-lab-p04-target create rolebinding p04-status-reader --role=p04-status-reader --serviceaccount=kv-lab:p04-reader')],
    verify: [s('Read the actual ConfigMap as the account, then assert the deny boundaries.', "identity=system:serviceaccount:kv-lab:p04-reader\ntest \"$(@cluster -n kv-lab-p04-target get cm p04-status --as=\"$identity\" -o jsonpath='{.data.environment}')\" = teaching\ntest \"$(@cluster -n kv-lab-p04-target auth can-i get configmaps/another --as=\"$identity\")\" = no\ntest \"$(@cluster -n kv-lab-p04-target auth can-i update configmaps/p04-status --as=\"$identity\")\" = no\ntest \"$(@cluster -n kv-lab-p04-target auth can-i get secrets --as=\"$identity\")\" = no")],
    cleanup: [step('Remove the home binding and the lab-owned target namespace.', 'bash cleanup.sh')],
    sources: [docs('RBAC RoleBindings and resource names', 'reference/access-authn-authz/rbac')],
  }, 'm11', ['resources.yaml', 'start.sh']),
];
