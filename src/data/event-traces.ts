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
};

export function getEventTrace(id: string) {
  return traces[id];
}
