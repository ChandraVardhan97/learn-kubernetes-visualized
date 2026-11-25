export type TraceActor = { label: string; area: string; x: number; y: number };

export type TraceEvent = {
  id: string;
  title: string;
  from: string;
  to: string;
  detail: string;
  field: string;
  before: string;
  after: string;
};

export type EventTrace = {
  label: string;
  scope: string;
  model: string;
  actors: Record<string, TraceActor>;
  events: readonly TraceEvent[];
  lab: { href: string; label: string; question: string; answer: string; check: string };
};

const traces: Readonly<Record<string, EventTrace | undefined>> = {
  'm06-l01-dataplane': {
    label: 'Inspect the request',
    scope: 'A ClusterIP connection in a cluster using kube-proxy in iptables mode. Start with how the node gets its forwarding rules, then follow one HTTP request.',
    model: 'Illustrative addresses and playback timing. The client already knows the Service IP. TCP handshake and other packet fields are omitted.',
    actors: {
      controller: { label: 'EndpointSlice controller', area: 'Control plane', x: 112, y: 53 },
      api: { label: 'API server', area: 'Control plane', x: 320, y: 53 },
      proxy: { label: 'kube-proxy', area: 'Node process', x: 528, y: 53 },
      client: { label: 'Client Pod', area: '10.244.1.5', x: 112, y: 166 },
      rules: { label: 'Forwarding rules', area: 'Node kernel', x: 320, y: 166 },
      backend: { label: 'Ready nginx Pod', area: '10.244.1.7:80', x: 528, y: 166 },
    },
    events: [
      {
        id: 'publish-endpoints', title: 'Publish eligible endpoints', from: 'controller', to: 'api',
        detail: 'The controller records the addresses and readiness of the Service’s matching Pods. An unready Pod can still appear in an EndpointSlice.',
        field: 'EndpointSlice ready addresses', before: 'No address published yet', after: '10.244.1.7:80 is ready',
      },
      {
        id: 'install-rules', title: 'Install node rules', from: 'proxy', to: 'rules',
        detail: 'kube-proxy watches Services and EndpointSlices and uses that state to configure the node. This work can happen before any client connects.',
        field: 'Eligible forwarding target for 10.96.0.42:8080', before: 'No rule for this Service yet', after: '10.244.1.7:80',
      },
      {
        id: 'connect', title: 'Connect to the Service', from: 'client', to: 'rules',
        detail: 'The client opens a TCP connection to the Service IP on port 8080. The node matches that destination to the Service’s forwarding rules.',
        field: 'Connection destination at the client', before: 'No connection', after: '10.96.0.42:8080',
      },
      {
        id: 'rewrite-destination', title: 'Rewrite the destination', from: 'rules', to: 'backend',
        detail: 'The node rewrites the destination to the chosen Pod IP and its target port. The HTTP request reaches nginx over the resulting connection.',
        field: 'Packet destination', before: '10.96.0.42:8080', after: '10.244.1.7:80',
      },
      {
        id: 'reply', title: 'Nginx sends HTTP 200', from: 'backend', to: 'rules',
        detail: 'Nginx answers from the Pod’s address. The kernel has the connection’s address translation recorded.',
        field: 'HTTP response', before: 'Awaiting a response', after: '200 OK from nginx',
      },
      {
        id: 'deliver-reply', title: 'Deliver the reply', from: 'rules', to: 'client',
        detail: 'The node reverses the destination translation for the return traffic. To the client, the reply comes from the same Service address it called.',
        field: 'Reply source', before: '10.244.1.7:80', after: '10.96.0.42:8080',
      },
    ],
    lab: {
      href: '/labs/#m06', label: 'Verify this in the Service lab',
      question: 'If the Service selector stops matching, which will fail first, the DNS lookup or the HTTP request?',
      answer: 'DNS can still return the Service IP. With no matching Pods, forwarding has no eligible backend, so the HTTP request fails.',
      check: 'Compare the Service selector, EndpointSlice readiness, and HTTP from the original client before and after the repair.',
    },
  },
  'm02-l03-request': {
    label: 'Inspect the Pod startup',
    scope: 'Follow the first successful apply of a standalone Pod called path-demo, from the API request through the first Ready report.',
    model: 'This is one possible successful sequence. The timeline is illustrative. Node setup and runtime calls are grouped.',
    actors: {
      cli: { label: 'kubectl', area: 'Your terminal', x: 112, y: 53 },
      api: { label: 'API server', area: 'Control plane', x: 320, y: 53 },
      etcd: { label: 'etcd', area: 'Control plane storage', x: 528, y: 53 },
      scheduler: { label: 'Scheduler', area: 'Control plane', x: 112, y: 166 },
      kubelet: { label: 'Kubelet', area: 'worker-a', x: 320, y: 166 },
      runtime: { label: 'Container runtime', area: 'worker-a', x: 528, y: 166 },
    },
    events: [
      {
        id: 'submit-pod', title: 'Submit the Pod', from: 'cli', to: 'api',
        detail: 'kubectl sends the Pod manifest. The API authenticates and authorizes the request and applies its admission and validation checks before storage.',
        field: 'Pod name in the request', before: 'Manifest on your machine', after: 'path-lab/path-demo submitted',
      },
      {
        id: 'store-pod', title: 'Store the Pod', from: 'api', to: 'etcd',
        detail: 'The API persists a Pod object and can acknowledge creation. A Pod can exist in the API while its node assignment is still empty.',
        field: 'Pod API record', before: 'Absent', after: 'Stored with a UID and no assigned node',
      },
      {
        id: 'bind-pod', title: 'Bind the Pod to a worker', from: 'scheduler', to: 'api',
        detail: 'The scheduler chooses a suitable worker and submits a binding. The node assignment tells the kubelet which Pod to start.',
        field: 'spec.nodeName', before: 'Unset', after: 'worker-a',
      },
      {
        id: 'start-container', title: 'Start the container', from: 'kubelet', to: 'runtime',
        detail: 'The kubelet observes the assignment and works with the runtime to prepare the Pod and start its nginx container. The image can already be cached.',
        field: 'Container state on worker-a', before: 'Waiting to start', after: 'Running',
      },
      {
        id: 'report-ready', title: 'Report Ready', from: 'kubelet', to: 'api',
        detail: 'After the Pod meets its readiness requirements, the kubelet reports that condition. kubectl wait can now observe Ready through the API.',
        field: 'status.conditions (Ready)', before: 'False or not yet reported', after: 'True',
      },
    ],
    lab: {
      href: '/labs/#m02', label: 'Verify startup in the reconciliation lab',
      question: 'A Pod has a node name and its container is still waiting. Which steps have completed?',
      answer: 'The API record exists and the scheduler has assigned a node. The kubelet still has work to do before it can report Ready.',
      check: 'Observe a replacement Pod with a new UID and compare its node, events, and Ready condition.',
    },
  },
  'm05-l02-rollout': {
    label: 'Inspect the rollout',
    scope: 'Follow rollout-demo from nginx 1.27.5 to 1.28.0. Three replicas are desired, with maxSurge: 1, maxUnavailable: 0, and minReadySeconds: 5.',
    model: 'The trace shows one healthy rollout. Playback time is illustrative. ReplicaSet writes go through the API server. Other failures and overlap with terminating Pods are outside these counts.',
    actors: {
      cli: { label: 'kubectl', area: 'Your terminal', x: 112, y: 53 },
      old: { label: 'Old ReplicaSet', area: 'nginx 1.27.5', x: 112, y: 166 },
      api: { label: 'API server', area: 'Deployment and Pod state', x: 320, y: 53 },
      deployment: { label: 'Deployment controller', area: 'Rollout decisions', x: 320, y: 166 },
      kubelet: { label: 'Kubelet', area: 'First replacement Pod', x: 528, y: 53 },
      replacement: { label: 'New ReplicaSet', area: 'nginx 1.28.0', x: 528, y: 166 },
    },
    events: [
      {
        id: 'update-template', title: 'Update the Pod template', from: 'cli', to: 'api',
        detail: 'kubectl sets the image on the Deployment. The changed template starts a rollout. The existing Pods still use the old image.',
        field: 'Deployment template image', before: 'nginx:1.27.5', after: 'nginx:1.28.0',
      },
      {
        id: 'use-surge', title: 'Use the surge slot', from: 'deployment', to: 'replacement',
        detail: 'The Deployment controller creates or finds the ReplicaSet for the new template and sets its target to one. That ReplicaSet creates the extra Pod while all three old replicas remain desired.',
        field: 'Desired replicas (old / new)', before: '3 / 0', after: '3 / 1',
      },
      {
        id: 'report-first-ready', title: 'The first replacement reports Ready', from: 'kubelet', to: 'api',
        detail: 'The new Pod passes its readiness check. Its Ready condition starts the five-second window before the rollout can count it as available.',
        field: 'First replacement Pod Ready', before: 'False', after: 'True',
      },
      {
        id: 'count-replacement', title: 'Count the replacement as available', from: 'api', to: 'deployment',
        detail: 'The replacement has stayed Ready for at least five seconds. There are now four available Pods in this snapshot, so the rollout can remove one old replica and retain three.',
        field: 'Available Pods (old / new)', before: '3 / 0', after: '3 / 1',
      },
      {
        id: 'retire-old-replica', title: 'Make room for another replacement', from: 'deployment', to: 'old',
        detail: 'The controller reduces the old ReplicaSet’s target. The old ReplicaSet removes one of its Pods. The one-replica surge slot can be used again.',
        field: 'Desired replicas (old / new)', before: '3 / 1', after: '2 / 1',
      },
      {
        id: 'complete-rollout', title: 'Finish with three updated Pods', from: 'deployment', to: 'api',
        detail: 'The controller repeats the exchange until three updated replicas are available and the old ReplicaSet is scaled to zero. kubectl rollout status can now report success.',
        field: 'Deployment updated replicas', before: '1 updated', after: '3 updated and available',
      },
    ],
    lab: {
      href: '/labs/#m05', label: 'Verify a rollout and undo in the Deployment lab',
      question: 'The first new Pod is Ready for only two seconds. Can the Deployment retire an old replica yet?',
      answer: 'It must wait for the new Pod to be Ready for all five seconds. At the two-second mark, the three old Pods still supply the full availability budget.',
      check: 'In the two-replica exercise, change a Pod template annotation. Compare rollout status and revision history, then undo and verify that the previous template is active.',
    },
  },
  'm07-l02-affinity': {
    label: 'Inspect the placement',
    scope: 'Add a third worker to the lesson’s example. The client Pod requires workload=tools and prefers the zone containing a cache Pod.',
    model: 'This snapshot gives the two eligible nodes equal scores from other plugins so the affinity preference decides. The scheduler evaluates its cached view of Pods and Nodes.',
    actors: {
      api: { label: 'API server', area: 'Unassigned client Pod', x: 112, y: 53 },
      scheduler: { label: 'Scheduler', area: 'Placement decision', x: 320, y: 53 },
      kubelet: { label: 'Kubelet', area: 'worker-a', x: 112, y: 166 },
      candidates: { label: 'Candidate workers', area: 'Cached node and Pod data', x: 528, y: 53 },
    },
    events: [
      {
        id: 'read-pending-pod', title: 'Observe the unassigned Pod', from: 'api', to: 'scheduler',
        detail: 'The scheduler observes a new client Pod without a node assignment. It reads the required worker label and the preferred affinity to Pods labeled app=cache.',
        field: 'Client Pod scheduling state', before: 'Stored without a node', after: 'Queued for placement',
      },
      {
        id: 'filter-workers', title: 'Filter out an ineligible worker', from: 'scheduler', to: 'candidates',
        detail: 'Worker-b has workload=general, so it fails the hard workload=tools requirement. Workers a and c match and satisfy the other modeled requirements.',
        field: 'Workers eligible for scoring', before: 'worker-a, worker-b, worker-c', after: 'worker-a, worker-c',
      },
      {
        id: 'rank-feasible-workers', title: 'Score the two feasible workers', from: 'scheduler', to: 'candidates',
        detail: 'The cache Pod runs in zone=east, the same zone as worker-a. Worker-c is in zone=west and remains eligible. With other scores equal, the affinity preference ranks worker-a first.',
        field: 'Placement preference', before: 'worker-a and worker-c both fit', after: 'worker-a ranks first',
      },
      {
        id: 'record-binding', title: 'Record the binding', from: 'scheduler', to: 'api',
        detail: 'The scheduler asks the API to bind the Pod to worker-a. The confirmed assignment is visible as spec.nodeName.',
        field: 'spec.nodeName', before: 'Unset', after: 'worker-a',
      },
      {
        id: 'observe-binding', title: 'The assigned kubelet can start work', from: 'api', to: 'kubelet',
        detail: 'The kubelet on worker-a observes the assignment. Starting containers and reporting readiness are separate steps.',
        field: 'Worker responsible for startup', before: 'No assigned worker', after: 'worker-a',
      },
    ],
    lab: {
      href: '/labs/#m07', label: 'Verify a hard constraint in the placement lab',
      question: 'Could worker-b win if a cache Pod moved into its zone?',
      answer: 'Worker-b would still fail the workload=tools requirement. Only workers that pass the filters can be ranked.',
      check: 'Compare the lab’s unschedulable Pod with the eligible Pod. Read the FailedScheduling event and nodeSelector, then check the assigned node on the eligible Pod.',
    },
  },
  'm14-l02-watch-cursor': {
    label: 'Inspect the watch',
    scope: 'A reader lists ConfigMaps, watches the same scope, then recovers when its last saved version is no longer available.',
    model: 'Cursor A, B, and C stand for resourceVersion values returned by the API. Replay the values unchanged in a real request. This example uses a traditional list followed by a watch, with no fixed expiry time.',
    actors: {
      client: { label: 'Watch client', area: 'ConfigMap reader', x: 112, y: 53 },
      api: { label: 'API server', area: 'ConfigMap collection', x: 320, y: 53 },
      cache: { label: 'Local cache', area: 'Reader’s object view', x: 112, y: 166 },
      writer: { label: 'ConfigMap writer', area: 'Same namespace', x: 528, y: 53 },
    },
    events: [
      {
        id: 'list-configmaps', title: 'List the ConfigMaps', from: 'api', to: 'client',
        detail: 'The list response contains the matching objects. The client builds its local view and keeps the collection resourceVersion as the point to watch from.',
        field: 'List metadata.resourceVersion', before: 'No initial cursor', after: 'Cursor A',
      },
      {
        id: 'start-watch', title: 'Watch from the list version', from: 'client', to: 'api',
        detail: 'The client starts a watch for the same namespace and label selector. The saved cursor lets it receive changes after the list snapshot, including changes made before the watch connection opened.',
        field: 'Watch resourceVersion parameter', before: 'No watch open', after: 'Cursor A',
      },
      {
        id: 'write-configmap', title: 'A writer changes the ConfigMap', from: 'writer', to: 'api',
        detail: 'The API accepts a change to data.message. The reader’s local cache catches up when it processes the watch event.',
        field: 'Stored data.message', before: 'fixed-point', after: 'release-two',
      },
      {
        id: 'apply-modified-event', title: 'Apply the MODIFIED event', from: 'api', to: 'client',
        detail: 'The server sends the modified object. The client updates its local copy and saves that event’s version, cursor B.',
        field: 'Cached data.message', before: 'fixed-point', after: 'release-two',
      },
      {
        id: 'resume-watch', title: 'Reconnect from the last processed event', from: 'client', to: 'api',
        detail: 'The watch disconnects. When the reader reconnects, it requests changes after the last version it processed.',
        field: 'Resume resourceVersion parameter', before: 'Disconnected', after: 'Cursor B',
      },
      {
        id: 'history-expired', title: 'The cursor is too old', from: 'api', to: 'client',
        detail: 'In this run the server no longer has the history needed to resume from cursor B. It reports 410 Gone, so the client needs a fresh list.',
        field: 'Watch response', before: 'Resume requested with cursor B', after: '410 Gone',
      },
      {
        id: 'rebuild-cache', title: 'List again and rebuild the cache', from: 'client', to: 'cache',
        detail: 'The reader lists the same scope again and rebuilds its local view from the returned objects. It can recover current state even though some intermediate events are unavailable.',
        field: 'Cached ConfigMap and list version', before: 'Stale view at cursor B', after: 'Fresh snapshot at cursor C',
      },
      {
        id: 'restart-watch', title: 'Watch from the fresh snapshot', from: 'client', to: 'api',
        detail: 'The client opens a new watch with the resourceVersion from its fresh list. Events after that snapshot can bring the cache forward again.',
        field: 'Watch resourceVersion parameter', before: 'Expired watch at cursor B', after: 'New watch at cursor C',
      },
    ],
    lab: {
      href: '/labs/#m15', label: 'Open a ConfigMap watch in the controller lab',
      question: 'The server returns 410 Gone. Can retrying cursor B recover the missing events?',
      answer: 'The client should rebuild its view from a new list and start watching from the returned version. Some intermediate changes may be unavailable.',
      check: 'Use the lab’s short watch to inspect its starting ConfigMap. The recovery from expired history is illustrated in this trace.',
    },
  },
  'm08-l02-directions': {
    label: 'Inspect the policy decision',
    scope: 'Follow the networking lab’s HTTP probe from m08-client to the m08 backend on TCP port 80. The client and backend are in kv-lab.',
    model: 'This cluster has NetworkPolicy enforcement. The client’s egress is unrestricted, the backend stays ready, and each probe opens a fresh connection. The diagram shows the effective policy decision. Packet handling varies by network plugin.',
    actors: {
      cli: { label: 'kubectl', area: 'Apply the policies', x: 112, y: 53 },
      api: { label: 'API server', area: 'Policy objects', x: 320, y: 53 },
      client: { label: 'm08-client', area: 'lab=m08', x: 112, y: 166 },
      network: { label: 'Policy enforcement', area: 'Pod network', x: 320, y: 166 },
      backend: { label: 'm08 backend', area: 'app=m08 · TCP 80', x: 528, y: 166 },
    },
    events: [
      {
        id: 'establish-http-baseline', title: 'Confirm HTTP works first', from: 'client', to: 'network',
        detail: 'The client reaches the ready backend through its Service. The successful probe gives you a working baseline before any policy change.',
        field: 'HTTP probe from m08-client', before: 'No probe yet', after: 'HTTP_OK',
      },
      {
        id: 'isolate-backend-ingress', title: 'Apply the ingress isolation policy', from: 'cli', to: 'api',
        detail: 'm08-deny selects backend Pods labeled app=m08 and declares Ingress with an empty rule list. Once enforced, those Pods require an explicit ingress allowance for new traffic from the client.',
        field: 'Ingress policy for app=m08', before: 'Unrestricted', after: 'Isolated with no ingress allowance',
      },
      {
        id: 'test-blocked-request', title: 'Test a new connection', from: 'client', to: 'network',
        detail: 'The client can send new traffic, and the backend still appears ready. The backend ingress has no matching allow rule, so this HTTP connection fails.',
        field: 'HTTP probe from m08-client', before: 'HTTP_OK', after: 'HTTP_FAILED',
      },
      {
        id: 'allow-the-client', title: 'Add the narrow ingress allowance', from: 'cli', to: 'api',
        detail: 'm08-allow selects the same backend and allows source Pods labeled lab=m08 in this namespace on TCP port 80. The two policies combine additively, and m08-deny stays in place.',
        field: 'Ingress allowed to TCP port 80', before: 'No lab peers allowed', after: 'Same-namespace Pods with lab=m08',
      },
      {
        id: 'verify-restored-http', title: 'Retry from the original client', from: 'network', to: 'backend',
        detail: 'Once the network enforces the new allowance, m08-client matches the peer selector and reaches the backend on port 80. Its HTTP probe succeeds again.',
        field: 'HTTP probe from m08-client', before: 'HTTP_FAILED', after: 'HTTP_OK',
      },
    ],
    lab: {
      href: '/labs/#m08', label: 'Reproduce all three HTTP results in the NetworkPolicy lab',
      question: 'If the client becomes egress-isolated and no egress rule allows this traffic, which direction now blocks the connection?',
      answer: 'Both directions have to permit the connection. An ingress allowance leaves source egress rules in effect.',
      check: 'Compare the client labels, the two NetworkPolicy objects, and the output of fresh probes from m08-client.',
    },
  },
  'm10-l01-claims': {
    label: 'Inspect the storage handoff',
    scope: 'Replace ledger-1 while its claim data-ledger-1 stays bound. Follow the Pod name, Pod UID, persistent volume, and file across the replacement.',
    model: 'The storage backend is healthy and the original claim is retained. The kubelet can remount the bound volume on an eligible node. The file comes from that volume.',
    actors: {
      cli: { label: 'kubectl', area: 'Read and replace', x: 112, y: 53 },
      controller: { label: 'StatefulSet controller', area: 'Maintains ordinal 1', x: 528, y: 53 },
      api: { label: 'API server', area: 'Pod and claim records', x: 320, y: 53 },
      writer: { label: 'ledger-1', area: 'Writer process', x: 528, y: 166 },
      kubelet: { label: 'Kubelet', area: 'Mounts the volume', x: 112, y: 166 },
      volume: { label: 'Persistent volume', area: 'Bound to data-ledger-1', x: 320, y: 166 },
    },
    events: [
      {
        id: 'read-original-identities', title: 'Record the Pod and claim', from: 'api', to: 'cli',
        detail: 'Read the UID of ledger-1, the UID of data-ledger-1, and the PV named in the claim. The writer has already recorded a start in /data/starts.',
        field: 'Storage identity for ledger-1', before: 'Unrecorded', after: 'Pod UID, PVC UID, and PV name recorded',
      },
      {
        id: 'delete-only-the-pod', title: 'Delete the Pod and keep the claim', from: 'cli', to: 'api',
        detail: 'Delete only ledger-1. Its containers stop, but the PVC remains bound to its volume. The StatefulSet still wants a Pod at ordinal 1.',
        field: 'Pod ledger-1', before: 'Original Pod exists', after: 'Original Pod removed',
      },
      {
        id: 'recreate-ordinal', title: 'Recreate ordinal 1', from: 'controller', to: 'api',
        detail: 'The controller creates a replacement named ledger-1. Kubernetes assigns a fresh UID to the replacement, and the Pod spec refers to the existing claim for ordinal 1.',
        field: 'ledger-1 metadata.uid', before: 'Original Pod UID', after: 'New Pod UID with the name ledger-1',
      },
      {
        id: 'reuse-bound-claim', title: 'Mount the existing claim', from: 'kubelet', to: 'volume',
        detail: 'On the assigned node, the kubelet and volume plugin prepare the same bound volume and mount it at /data for the replacement. The ordinal continues using its original storage.',
        field: 'PVC used by ledger-1', before: 'data-ledger-1 mounted by the original Pod', after: 'data-ledger-1 mounted by the replacement',
      },
      {
        id: 'read-retained-file', title: 'Read the retained file', from: 'writer', to: 'volume',
        detail: 'The new process appends its hostname to /data/starts. Reading the old line and the new entry confirms that a new process is using the same stored data.',
        field: '/data/starts', before: 'Earlier start recorded', after: 'Earlier start and new start recorded',
      },
    ],
    lab: {
      href: '#practice-replace-one-member-and-inspect-continuity', label: 'Replace ledger-1 and check the evidence',
      question: 'After replacement, does seeing the name ledger-1 prove it is the original Pod?',
      answer: 'The name identifies the ordinal. Compare the UID to identify the Pod object, then compare the PVC UID and PV name to verify storage continuity.',
      check: 'Save the Pod UID and volume binding, replace only ledger-1, and compare both with the file read from the replacement.',
    },
  },
  'm16-l03-operator-repair-gc': {
    label: 'Inspect the child repair',
    scope: 'Delete the generated ConfigMap m16 while its WebApp stays present. Run one pass of the lab’s polling reconciler and inspect the repair.',
    model: 'This replay follows the teaching script with an unchanged WebApp spec. The repair is a reconcile pass against current API state. Kubernetes garbage collection is a separate path when an owner is deleted.',
    actors: {
      cli: { label: 'kubectl', area: 'Delete only the child', x: 112, y: 53 },
      api: { label: 'API server', area: 'Current object state', x: 320, y: 53 },
      config: { label: 'ConfigMap m16', area: 'Generated page data', x: 112, y: 166 },
      reconciler: { label: 'WebApp reconciler', area: 'Python polling script', x: 320, y: 166 },
      parent: { label: 'WebApp m16', area: 'Desired page and replicas', x: 528, y: 53 },
      deployment: { label: 'Deployment m16', area: 'Surviving child', x: 528, y: 166 },
    },
    events: [
      {
        id: 'delete-configmap', title: 'Delete only the generated ConfigMap', from: 'cli', to: 'api',
        detail: 'The ConfigMap disappears. The Deployment and WebApp still exist, and the WebApp still declares the page the reconciler should generate.',
        field: 'Generated ConfigMap m16', before: 'Present', after: 'Absent',
      },
      {
        id: 'read-current-parent', title: 'Read the current WebApp and its UID', from: 'api', to: 'reconciler',
        detail: 'On the next pass, the script reads WebApp m16. It uses the message for the desired ConfigMap and the current WebApp UID for the owner reference.',
        field: 'WebApp m16 desired page', before: 'Declared in spec.message', after: 'Desired ConfigMap prepared from the same spec',
      },
      {
        id: 'check-child-absence', title: 'Check whether the child name is in use', from: 'reconciler', to: 'api',
        detail: 'The script checks whether a ConfigMap named m16 exists. An absent child can be created. An existing object owned by a different UID would stop this repair.',
        field: 'Lookup for ConfigMap m16', before: 'Ownership or absence unknown', after: 'Absent, so creation can proceed',
      },
      {
        id: 'restore-owned-configmap', title: 'Recreate the owned ConfigMap', from: 'reconciler', to: 'config',
        detail: 'The script applies the page through the API. The new ConfigMap has the same name but receives a new UID. Its owner reference points to the current WebApp.',
        field: 'ConfigMap m16', before: 'Absent', after: 'New UID, original WebApp owner UID',
      },
      {
        id: 'preserve-existing-deployment', title: 'Keep the existing Deployment', from: 'reconciler', to: 'deployment',
        detail: 'The script verifies the Deployment’s owner UID and reapplies the same desired fields. The Deployment object keeps its UID.',
        field: 'Deployment m16 metadata.uid', before: 'Original Deployment UID', after: 'Same Deployment UID',
      },
    ],
    lab: {
      href: '/labs/#m16', label: 'Delete and repair the generated child in the operator lab',
      question: 'If another object already uses the ConfigMap name, can the script take it over just because the name matches?',
      answer: 'The script checks the controlling owner’s UID. A mismatched UID stops the apply for that child.',
      check: 'After the reconcile pass, compare the generated ConfigMap owner UID with the WebApp UID and verify the Deployment’s ready replica count.',
    },
  },
  'm05-l03-probes': {
    label: 'Inspect what each probe changes',
    scope: 'Follow one web Pod through startup, a temporary readiness failure, and a separate liveness failure. Its Service has a second healthy backend.',
    model: 'The startup probe is from the lesson example. The lab uses separate readiness and liveness checks. Probe intervals and delays between API updates are compressed.',
    actors: {
      web: { label: 'Web container', area: 'One Pod', x: 112, y: 166 },
      api: { label: 'API server', area: 'Pod conditions', x: 320, y: 53 },
      kubelet: { label: 'Kubelet', area: 'Worker node', x: 112, y: 53 },
      endpoints: { label: 'EndpointSlice controller', area: 'Service backends', x: 528, y: 53 },
      runtime: { label: 'Container runtime', area: 'Worker node', x: 320, y: 166 },
    },
    events: [
      {
        id: 'finish-startup', title: 'Startup succeeds', from: 'kubelet', to: 'web',
        detail: 'The kubelet has been running only the configured startup probe. After it passes, the kubelet can run readiness and liveness checks on their own schedules. Readiness soon passes and the Pod starts receiving traffic.',
        field: 'Readiness and liveness checks', before: 'Waiting for the startup probe', after: 'Both can run',
      },
      {
        id: 'report-unready', title: 'Report the readiness failure', from: 'kubelet', to: 'api',
        detail: 'The readiness check reaches its failure threshold. The liveness check still passes, so the web process keeps running. The kubelet reports the Pod as unready.',
        field: 'Pod Ready / container restart count', before: 'True / 0', after: 'False / 0',
      },
      {
        id: 'exclude-unready-backend', title: 'Exclude the unready backend', from: 'api', to: 'endpoints',
        detail: 'The EndpointSlice controller observes the Pod condition and updates its endpoint. As that update reaches the forwarding layer, ordinary new connections go to the healthy backend.',
        field: 'This endpoint’s ready condition', before: 'true', after: 'false',
      },
      {
        id: 'readiness-recovers', title: 'Readiness recovers', from: 'kubelet', to: 'api',
        detail: 'A later check succeeds. The same container can serve requests again once the updated Pod and endpoint conditions propagate.',
        field: 'Pod Ready / container restart count', before: 'False / 0', after: 'True / 0',
      },
      {
        id: 'restart-container', title: 'Restart the web container', from: 'kubelet', to: 'runtime',
        detail: 'Later, the liveness check reaches its own failure threshold. The kubelet asks the runtime to stop the container and restarts it under the Pod’s Always restart policy. The startup check runs again for the new container instance.',
        field: 'Pod UID / container restart count', before: 'Same Pod UID / 0', after: 'Same Pod UID / 1',
      },
    ],
    lab: {
      href: '/labs/#m05', label: 'Verify readiness in the probe and rollout lab',
      question: 'If a dependency goes offline but your web process can recover on its own, which check should usually fail?',
      answer: 'Readiness can take the Pod out of ordinary Service traffic while the dependency recovers. Repeated liveness failures restart the container, which may accomplish nothing during a dependency outage.',
      check: 'Record the Pod UID and restart count before removing its readiness file. Compare those fields with the Pod Ready and EndpointSlice ready conditions after the failure.',
    },
  },
  'm06-l02-dns': {
    label: 'Inspect the DNS lookup',
    scope: 'A client in kv-lab looks up the short Service name m06. Follow the DNS answer, then retry the request after the Service selector stops matching.',
    model: 'Uses the lab’s names and an illustrative IPv4 ClusterIP. The Pod uses the standard cluster DNS search list. DNS caching and packet forwarding implementation details are omitted.',
    actors: {
      dns: { label: 'CoreDNS', area: 'Cluster DNS', x: 528, y: 53 },
      resolver: { label: 'Pod resolver', area: 'DNS search list', x: 320, y: 53 },
      app: { label: 'Client process', area: 'Pod in kv-lab', x: 112, y: 53 },
      service: { label: 'Service m06', area: 'API object', x: 528, y: 166 },
      routing: { label: 'Service forwarding', area: '10.96.0.42:80', x: 320, y: 166 },
      backend: { label: 'Ready web Pods', area: 'Deployment m06', x: 112, y: 166 },
    },
    events: [
      {
        id: 'expand-service-name', title: 'Expand the short Service name', from: 'resolver', to: 'dns',
        detail: 'The client asks for m06. Its resolver tries the namespace search suffix kv-lab.svc.cluster.local and sends the resulting DNS query to CoreDNS.',
        field: 'Name being looked up', before: 'm06', after: 'm06.kv-lab.svc.cluster.local.',
      },
      {
        id: 'return-cluster-ip', title: 'Return the Service IP', from: 'dns', to: 'resolver',
        detail: 'CoreDNS uses Service data it watches through the API. For this ClusterIP Service, the IPv4 DNS answer contains the Service IP. A separate forwarding decision will select a Pod.',
        field: 'DNS A record answer', before: 'Waiting for the reply', after: '10.96.0.42',
      },
      {
        id: 'connect-to-service-ip', title: 'Connect to the returned address', from: 'app', to: 'routing',
        detail: 'The resolver hands the IP back to the client process. The client opens a TCP connection to that address on port 80.',
        field: 'TCP destination', before: 'No connection yet', after: '10.96.0.42:80',
      },
      {
        id: 'connect-via-service', title: 'Reach a web Pod through the Service', from: 'routing', to: 'backend',
        detail: 'The forwarding layer sends the connection to one eligible endpoint, where the web server returns HTTP 200.',
        field: 'HTTP request', before: 'Connection to the Service IP', after: '200 OK from a matching Pod',
      },
      {
        id: 'selector-stops-matching', title: 'Change the selector without changing the IP', from: 'service', to: 'routing',
        detail: 'Someone changes the Service selector to a label the two web Pods lack. After the EndpointSlice update propagates, forwarding has no matching backends. The Service keeps its name and ClusterIP.',
        field: 'Eligible Service backends', before: '2', after: '0',
      },
      {
        id: 'resolve-without-backends', title: 'Resolve the name with zero backends', from: 'dns', to: 'resolver',
        detail: 'DNS still returns the Service IP in this setup. The client’s new connection fails because there is no eligible endpoint. Successful DNS tells you only that the name resolved.',
        field: 'DNS answer / eligible backends', before: '10.96.0.42 / 2', after: '10.96.0.42 / 0',
      },
    ],
    lab: {
      href: '/labs/#m06', label: 'Compare DNS and HTTP in the Service lab',
      question: 'When nslookup returns the expected Service IP but HTTP fails, what should you check next?',
      answer: 'Check the Service port and target port, then compare its selector with the Pod labels and read its EndpointSlices for eligible addresses.',
      check: 'Run nslookup and an HTTP request from the same client Pod before and after repairing the selector.',
    },
  },
  'm10-l03-termination': {
    label: 'Inspect the shutdown',
    scope: 'Delete one web Pod behind a Service with another healthy backend. Follow endpoint changes in the control plane and shutdown on the worker node.',
    model: 'The diagram shows one possible order. Endpoint updates and kubelet shutdown run concurrently. No change to an EndpointSlice closes an established connection by itself.',
    actors: {
      cli: { label: 'kubectl', area: 'Your terminal', x: 112, y: 53 },
      api: { label: 'API server', area: 'Pod object', x: 320, y: 53 },
      endpoints: { label: 'EndpointSlice controller', area: 'Service backends', x: 528, y: 53 },
      kubelet: { label: 'Kubelet', area: 'Worker node', x: 112, y: 166 },
      runtime: { label: 'Container runtime', area: 'Worker node', x: 320, y: 166 },
      process: { label: 'Web process', area: 'Departing Pod', x: 528, y: 166 },
    },
    events: [
      {
        id: 'request-pod-deletion', title: 'Start the termination grace period', from: 'cli', to: 'api',
        detail: 'The API server accepts the deletion and records the grace period and deletion timestamp. The Pod stays visible while its containers wind down.',
        field: 'Pod metadata.deletionTimestamp', before: 'Unset', after: 'Set to the deletion deadline',
      },
      {
        id: 'run-prestop-hook', title: 'Run the preStop hook', from: 'kubelet', to: 'runtime',
        detail: 'The kubelet sees the terminating Pod and runs its configured preStop hook. The hook spends part of the Pod’s existing grace period.',
        field: 'Local shutdown', before: 'Web process running', after: 'Hook running within the grace period',
      },
      {
        id: 'mark-terminating-endpoint', title: 'Mark the endpoint as terminating', from: 'api', to: 'endpoints',
        detail: 'Independently, the EndpointSlice controller sees the deletion. This endpoint can still be listed with serving=true while its readiness for ordinary routing is false. New connections can use the other healthy backend once the forwarding layer sees the change.',
        field: 'EndpointSlice conditions', before: 'ready=true, terminating=false', after: 'ready=false, terminating=true',
      },
      {
        id: 'signal-web-process', title: 'Send the stop signal after the hook', from: 'runtime', to: 'process',
        detail: 'Once the hook finishes, the runtime signals the container’s main process. The signal can come from the image configuration. An application that handles it can finish requests within the remaining time.',
        field: 'Web process', before: 'Running during the hook', after: 'Handling the stop signal',
      },
      {
        id: 'finish-pod-shutdown', title: 'The web process exits within the grace period', from: 'process', to: 'runtime',
        detail: 'The web process finishes and exits. If processes outlast the grace period, the runtime forcibly stops them. The API object and its endpoint are then removed as cleanup completes.',
        field: 'Container process', before: 'Shutting down', after: 'Exited before forced termination',
      },
    ],
    lab: {
      href: '#practice-watch-the-endpoint-while-the-pod-exits', label: 'Watch an endpoint during a real shutdown',
      question: 'Does preStop receive its own full timeout before the Pod’s grace period begins?',
      answer: 'The countdown is already running when the hook starts. Time spent in preStop reduces the time left for the application to handle its stop signal.',
      check: 'Watch ready and terminating on the EndpointSlice while deleting the Pod. Compare the endpoint update with the time at which the Pod disappears.',
    },
  },
  'm11-l01-authorization': {
    label: 'Inspect the permission check',
    scope: 'A reporting app can list Pods in kv-lab. Follow that decision, then change the API verb to delete and see why the same identity gets a different answer.',
    model: 'Uses the permissions lab’s ServiceAccount and RoleBinding. Only this binding grants Pod permissions to the identity in this example. The lab uses impersonation to check permissions without reading a token.',
    actors: {
      reader: { label: 'Pod reader', area: 'm11-reader identity', x: 112, y: 53 },
      api: { label: 'API server', area: 'Request attributes', x: 320, y: 53 },
      rbac: { label: 'RBAC authorizer', area: 'Permission check', x: 528, y: 53 },
      binding: { label: 'RoleBinding', area: 'Namespace kv-lab', x: 528, y: 166 },
      role: { label: 'Role', area: 'Rules for pods', x: 320, y: 166 },
    },
    events: [
      {
        id: 'identify-pod-reader', title: 'Identify the Pod reader', from: 'reader', to: 'api',
        detail: 'The API server has established that the caller is system:serviceaccount:kv-lab:m11-reader. It passes that identity and the request attributes to authorization.',
        field: 'Request attributes', before: 'An authenticated caller', after: 'list · pods · kv-lab',
      },
      {
        id: 'find-role-binding', title: 'Find a binding for this caller', from: 'rbac', to: 'binding',
        detail: 'For this namespaced request, RBAC finds a RoleBinding in kv-lab whose subject matches the ServiceAccount. The binding points to the Role named m11-reader.',
        field: 'Source of the permission', before: 'ServiceAccount m11-reader', after: 'RoleBinding m11-reader → Role m11-reader',
      },
      {
        id: 'match-list-rule', title: 'Match the list rule', from: 'binding', to: 'role',
        detail: 'The referenced Role covers the core API resource pods and includes the list verb. The API server can return the Pod list for kv-lab.',
        field: 'Authorization for list pods', before: 'Checking API group, resource, and verb', after: 'Allowed by get, list, watch on pods',
      },
      {
        id: 'compare-delete-verb', title: 'Try the delete verb', from: 'api', to: 'rbac',
        detail: 'A second request asks to delete one named Pod in the same namespace. The Role still matches the resource, but none of its verbs grants deletion.',
        field: 'Verb checked against the Role', before: 'list → rule matches', after: 'delete → no matching grant',
      },
      {
        id: 'reject-delete', title: 'Reject the delete request', from: 'api', to: 'reader',
        detail: 'No applicable authorization rule allows this request. The API server returns Forbidden and leaves the Pod in place.',
        field: 'HTTP result for the same identity', before: 'List Pods → 200 OK', after: 'Delete Pod → 403 Forbidden',
      },
    ],
    lab: {
      href: '/labs/#m11', label: 'Check the reader’s permissions in kind',
      question: 'If another RoleBinding grants this ServiceAccount delete on Pods in kv-lab, will the reader Role still keep it from deleting them?',
      answer: 'RBAC permissions add together. The second binding grants delete in kv-lab. Leaving delete out of the reader Role does not cancel another grant.',
      check: 'Run kubectl auth can-i for both list pods and delete pods with the same impersonated identity and namespace.',
    },
  },
  'm13-l02-hpa-loop': {
    label: 'Inspect the scale-down decision',
    scope: 'Traffic has dropped and the HPA has fresh metrics, but the Deployment still wants six replicas. Follow the latest calculation and the recent recommendation that keeps the count up.',
    model: 'Illustrative CPU values and compressed time. All Pods are ready and have complete metrics and equal requests. The lesson configures a 300-second scale-down stabilization window. This example assumes scale-down rate policies permit the final change.',
    actors: {
      metrics: { label: 'Resource metrics', area: 'CPU utilization', x: 112, y: 53 },
      hpa: { label: 'HPA controller', area: 'Target CPU 60%', x: 320, y: 53 },
      recommendations: { label: 'Recommendations', area: 'Last 300 seconds', x: 528, y: 53 },
      scale: { label: 'Deployment scale', area: 'Desired replicas', x: 320, y: 166 },
      pods: { label: 'API replicas', area: 'Observed replicas', x: 528, y: 166 },
    },
    events: [
      {
        id: 'read-lower-usage', title: 'Observe lower CPU usage', from: 'metrics', to: 'hpa',
        detail: 'The busy period left a recent recommendation of six replicas. The six replicas are now ready and traffic has fallen. In this example, each now uses 40m against a request of 200m.',
        field: 'Latest utilization and configured target', before: '60% observed / 60% target', after: '20% observed / 60% target',
      },
      {
        id: 'calculate-two-replicas', title: 'Calculate a lower recommendation', from: 'hpa', to: 'recommendations',
        detail: 'With the example’s complete metrics, six current replicas multiplied by 20% divided by 60% gives a recommendation of two. That is also the configured lower bound.',
        field: 'Replica recommendation from the latest metric', before: '6 Pods', after: '2 Pods',
      },
      {
        id: 'retain-higher-recommendation', title: 'Keep the higher recent recommendation', from: 'recommendations', to: 'hpa',
        detail: 'For a scale-down, the controller uses the highest recommendation that is still inside the stabilization window. Six is still in that window, so the Deployment keeps its desired count.',
        field: 'Recommendations in the stabilization window', before: '6 Pods, 2 Pods', after: '6 Pods selected',
      },
      {
        id: 'lower-desired-count', title: 'Lower the desired count after the window', from: 'hpa', to: 'scale',
        detail: 'Low utilization persists. Once the higher recommendation ages out and the scaling policies allow the change, the HPA writes two replicas through the Deployment’s scale subresource.',
        field: 'Deployment desired replicas', before: '6', after: '2',
      },
      {
        id: 'observe-fewer-pods', title: 'Observe the Deployment converge', from: 'scale', to: 'pods',
        detail: 'The Deployment and ReplicaSet controllers act on the new count. The four extra Pods terminate. Watching the workload shows when the new count is reached.',
        field: 'Replicas still running', before: '6 while cleanup starts', after: '2 after cleanup finishes',
      },
    ],
    lab: {
      href: '#practice-watch-all-checkpoints-not-just-the-desired-count', label: 'Compare HPA conditions and Deployment replicas',
      question: 'If CPU has been below target for one minute, does a five-minute stabilization window have to allow scale-down yet?',
      answer: 'A higher recommendation can still be inside the window. The controller considers the recent recommendation history when deciding how far to scale down.',
      check: 'With a working Metrics API, watch the current CPU metric, the HPA’s desired count, and the Deployment’s actual count as load falls.',
    },
  },
  'm14-l03-finalizer-hold': {
    label: 'Inspect the pending deletion',
    scope: 'Delete the lab ConfigMap while it has a teaching finalizer. Follow the API response, inspect the remaining object, and see when it disappears.',
    model: 'The lab’s finalizer is a marker with no controller or external cleanup behind it. A production controller normally verifies the cleanup associated with its own finalizer before removing that key.',
    actors: {
      cli: { label: 'kubectl', area: 'API client', x: 112, y: 53 },
      api: { label: 'API server', area: 'Deletion protocol', x: 320, y: 53 },
      config: { label: 'ConfigMap m14', area: 'Stored object', x: 528, y: 53 },
      operator: { label: 'Lab operator', area: 'Releases teaching key', x: 320, y: 166 },
    },
    events: [
      {
        id: 'request-deletion', title: 'Request deletion with the key present', from: 'cli', to: 'api',
        detail: 'The lab operator sends a DELETE request. The API server accepts the request and sets metadata.deletionTimestamp. The finalizer still gates removal.',
        field: 'Delete request', before: 'Sent to the API server', after: 'Accepted, finalizer still present',
      },
      {
        id: 'read-pending-deletion', title: 'The ConfigMap is still visible', from: 'api', to: 'config',
        detail: 'kubectl get still returns the ConfigMap. Its deletion timestamp records the pending deletion, and metadata.finalizers shows which key is holding it.',
        field: 'ConfigMap state', before: 'No deletion timestamp, finalizer present', after: 'Deletion timestamp set, finalizer still present',
      },
      {
        id: 'release-verified-lab-marker', title: 'Remove the verified teaching marker', from: 'operator', to: 'api',
        detail: 'In the lab, the operator can safely remove this one key because the marker owns no external resources. A real controller would verify its own cleanup first.',
        field: 'Deletion gate', before: 'labs.kv.example/hold', after: 'No remaining finalizer blocks removal',
      },
      {
        id: 'confirm-object-disappears', title: 'Confirm the object is gone', from: 'api', to: 'cli',
        detail: 'The API server has completed deletion. A fresh GET for ConfigMap m14 now returns NotFound.',
        field: 'GET ConfigMap m14', before: '200 OK with deletionTimestamp', after: '404 Not Found',
      },
    ],
    lab: {
      href: '/labs/#m14', label: 'Inspect and release the practice finalizer',
      question: 'What should you check before removing an unfamiliar finalizer?',
      answer: 'Identify the controller and the cleanup associated with the key. Removing it early can leave resources behind that Kubernetes can no longer track through the deleted object.',
      check: 'Read metadata.deletionTimestamp and metadata.finalizers after deletion, then verify the object is gone after releasing the teaching key.',
    },
  },
  'm06-l03-startup': {
    label: 'Inspect the crash loop',
    scope: 'A Pod starts, but its app exits before becoming Ready. Follow the retries, read the previous container’s log, and fix the setting in the Deployment.',
    model: 'Uses a deliberately failing startup check in the lesson exercise. The animation compresses the kubelet’s retry delays and groups the rollout’s controller actions.',
    actors: {
      cli: { label: 'kubectl', area: 'Your terminal', x: 112, y: 166 },
      deployment: { label: 'Deployment', area: 'Pod template', x: 112, y: 53 },
      kubelet: { label: 'Kubelet', area: 'Restarts containers', x: 320, y: 166 },
      replica: { label: 'ReplicaSet', area: 'Creates Pods', x: 320, y: 53 },
      process: { label: 'App container', area: 'Startup script', x: 528, y: 166 },
      pod: { label: 'Pod', area: 'Container status', x: 528, y: 53 },
    },
    events: [
      {
        id: 'start-app', title: 'Start the app container', from: 'kubelet', to: 'process',
        detail: 'The image is available, so the worker starts the container. Its startup script checks for APP_CONFIG before reporting readiness.',
        field: 'Container process', before: 'Waiting to start', after: 'Running the startup script',
      },
      {
        id: 'record-startup-exit', title: 'The app exits before it is Ready', from: 'process', to: 'kubelet',
        detail: 'APP_CONFIG is missing. The process writes a message to its log and exits with code 1. The worker records the termination.',
        field: 'Last container termination', before: 'No previous exit', after: 'Error, exit code 1',
      },
      {
        id: 'delay-next-restart', title: 'Wait before trying again', from: 'kubelet', to: 'pod',
        detail: 'The kubelet restarts the container as the Pod’s policy allows. Repeated failures cause a delay between attempts. CrashLoopBackOff is the container’s waiting reason and can appear in kubectl get pods.',
        field: 'Container waiting reason', before: 'Previous attempt terminated', after: 'CrashLoopBackOff',
      },
      {
        id: 'read-previous-logs', title: 'Read the previous container logs', from: 'cli', to: 'kubelet',
        detail: 'kubectl logs --previous requests the terminated container’s log through the API server. The log names the setting that the display status alone cannot identify.',
        field: 'Evidence from the failed start', before: 'CrashLoopBackOff, exit code 1', after: 'APP_CONFIG is required',
      },
      {
        id: 'correct-pod-template', title: 'Set the missing environment variable', from: 'cli', to: 'deployment',
        detail: 'kubectl set env changes the Deployment’s Pod template. That starts a rollout with the corrected setting.',
        field: 'APP_CONFIG in the Pod template', before: 'Missing', after: 'ready',
      },
      {
        id: 'replacement-ready', title: 'The replacement Pod becomes Ready', from: 'replica', to: 'pod',
        detail: 'The new ReplicaSet creates a Pod from the corrected template. Its app keeps running and passes the readiness check. The rollout can finish once the new replica is available.',
        field: 'Deployment availability', before: 'No available replica', after: 'One available replica',
      },
    ],
    lab: {
      href: '#practice-reproduce-a-crash-loop', label: 'Reproduce and fix the startup failure',
      question: 'If kubectl reports CrashLoopBackOff again, can you tell which configuration value is missing from that message alone?',
      answer: 'The waiting reason only tells you that retries are being delayed. Read the previous container logs and termination details to find this failure’s cause.',
      check: 'Read the last exit code and previous logs, then compare the Pod name and readiness before and after the rollout.',
    },
  },
  'm09-l02-binding': {
    label: 'Inspect a Pending claim',
    scope: 'A report needs local storage. Follow a healthy claim that starts Pending, then compare it with a separate claim whose StorageClass is missing.',
    model: 'Uses kind’s standard local-path StorageClass, which delays provisioning until a consumer is scheduled. The chosen worker can vary. Other classes and drivers can behave differently.',
    actors: {
      class: { label: 'StorageClass', area: 'Class lookup', x: 112, y: 53 },
      claim: { label: 'PVC', area: 'Requests storage', x: 320, y: 53 },
      consumer: { label: 'Report Pod', area: 'Mounts the claim', x: 528, y: 166 },
      scheduler: { label: 'Scheduler', area: 'Chooses a worker', x: 528, y: 53 },
      volume: { label: 'PersistentVolume', area: 'Local to the worker', x: 112, y: 166 },
      provisioner: { label: 'Local provisioner', area: 'Creates the volume', x: 320, y: 166 },
    },
    events: [
      {
        id: 'wait-for-consumer', title: 'Wait for a consumer', from: 'class', to: 'claim',
        detail: 'The report-data claim names standard. That class uses WaitForFirstConsumer. With no Pod using the claim, provisioning is deferred. The claim’s event explains why it is Pending.',
        field: 'Claim state', before: 'Claim submitted', after: 'Pending / WaitForFirstConsumer',
      },
      {
        id: 'create-report-pod', title: 'Create the Pod that uses the claim', from: 'consumer', to: 'scheduler',
        detail: 'The report-reader Pod refers to the claim in its volume list. The scheduler can now evaluate where the Pod and its storage can run together.',
        field: 'Consumer for report-data', before: 'No Pod uses the claim', after: 'report-reader requests the claim',
      },
      {
        id: 'select-node-for-provisioning', title: 'Choose a worker for provisioning', from: 'scheduler', to: 'claim',
        detail: 'For this dynamically provisioned claim, the scheduler records the selected worker on the PVC. The local provisioner uses that choice to place the volume on the same worker.',
        field: 'PVC selected node annotation', before: 'Unset', after: 'Selected worker',
      },
      {
        id: 'bind-volume', title: 'Provision and bind the local volume', from: 'provisioner', to: 'volume',
        detail: 'The provisioner creates a volume whose node affinity matches that worker. The claim binds to the new PersistentVolume.',
        field: 'PVC phase / assigned volume', before: 'Pending / no volume', after: 'Bound / local PersistentVolume',
      },
      {
        id: 'run-with-mounted-volume', title: 'Start the Pod with its volume mounted', from: 'scheduler', to: 'consumer',
        detail: 'The scheduler can finish binding the Pod to the worker. The kubelet starts it with the volume mounted at /data.',
        field: 'Report Pod', before: 'Waiting for storage to bind', after: 'Ready with /data mounted',
      },
      {
        id: 'compare-missing-class', title: 'Compare a claim with a missing class', from: 'claim', to: 'class',
        detail: 'The separate p03 claim names p03-missing. Its Pod cannot trigger provisioning through a class the cluster does not have. In this disposable lab, learners recreate the unbound practice claim with standard.',
        field: 'Two claims with the same phase', before: 'standard: Pending, waiting for a consumer', after: 'p03-missing: Pending, class not found',
      },
    ],
    lab: {
      href: '/labs/#p03', label: 'Diagnose and repair the missing class',
      question: 'What should you check before deciding whether a Pending claim needs a fix?',
      answer: 'Check whether the named StorageClass exists, read its binding mode, and inspect the claim’s events. A delayed-binding claim can wait normally for its first consumer.',
      check: 'Compare kubectl describe pvc with kubectl get storageclass. Look at the actual class name and event message before repairing the unbound teaching claim.',
    },
  },
  'm14-l02-apply-owners': {
    label: 'Inspect the apply conflict',
    scope: 'A Git manager and a human manager both apply the same ConfigMap field. Follow the rejected change and the successful apply when they agree on the value.',
    model: 'Uses two Server-Side Apply requests to one teaching ConfigMap. Ownership evidence is scoped to data.release. The API server may track other fields for these managers as well.',
    actors: {
      git: { label: 'Git field manager', area: 'kv-gitops', x: 112, y: 53 },
      api: { label: 'API server', area: 'Field ownership check', x: 320, y: 53 },
      human: { label: 'Human field manager', area: 'kv-human', x: 528, y: 53 },
      config: { label: 'ConfigMap', area: 'm14-ownership', x: 320, y: 166 },
    },
    events: [
      {
        id: 'apply-git-value', title: 'Apply the Git value', from: 'git', to: 'api',
        detail: 'The first Server-Side Apply request creates m14-ownership with data.release set to git-declared. The API server records kv-gitops as the manager of that field.',
        field: 'Live value / field manager', before: 'No ConfigMap', after: 'git-declared / kv-gitops',
      },
      {
        id: 'apply-different-value', title: 'Apply a different value as the human manager', from: 'human', to: 'api',
        detail: 'kv-human tries to set data.release to human-declared. The API server finds that kv-gitops already owns the field and that the incoming value differs.',
        field: 'Live value compared with the incoming value', before: 'git-declared', after: 'human-declared requested',
      },
      {
        id: 'reject-conflicting-value', title: 'Reject the conflicting value', from: 'api', to: 'human',
        detail: 'The API reports a conflict with kv-gitops on .data.release. The rejected change leaves the stored ConfigMap unchanged.',
        field: 'Apply response / live data.release', before: 'Change requested / git-declared', after: '409 Conflict / git-declared',
      },
      {
        id: 'apply-agreed-value', title: 'Apply the value both managers agree on', from: 'human', to: 'api',
        detail: 'kv-human applies the original file with data.release set to git-declared. Because the value is the same, the apply can succeed and record kv-human as a co-owner.',
        field: 'Requested data.release from kv-human', before: 'human-declared', after: 'git-declared',
      },
      {
        id: 'inspect-shared-ownership', title: 'Confirm both managers own the field', from: 'api', to: 'config',
        detail: 'The live release value is still git-declared. The managedFields entries now list data.release under both managers. Future changes to that shared field still need to account for both claims.',
        field: 'Owners of data.release', before: 'kv-gitops', after: 'kv-gitops and kv-human',
      },
    ],
    lab: {
      href: '#practice-capture-a-conflict-instead-of-suppressing-it', label: 'Reproduce the conflict and check the owners',
      question: 'If the apply is rejected, what should you check to confirm whether it changed the object?',
      answer: 'Read the live value and check which manager owns that field. In this exercise, both stay the same after the conflict.',
      check: 'Use kubectl get with --show-managed-fields before the conflict and after both managers have applied the agreed value.',
    },
  },
};

export function getEventTrace(id: string) {
  return traces[id];
}
