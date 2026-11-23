export const timing = {
  scale: { request: 1100, desired: 550, target: 2450, creating: 2900, created: 4200, ready: 5850, end: 6900 },
  service: { connect: 450, forward: 1950, received: 3550, reply: 4200, complete: 6580, end: 7550 },
  crd: {
    registered: 2150, registrationEnd: 3000,
    stored: 4750, storeEnd: 5600,
    running: 6100, configMap: 7540, deployment: 8310, end: 9300,
  },
} as const;

export function scaleState(time: number) {
  const { desired, target, created, ready } = timing.scale;
  return {
    desired: time >= desired ? 3 : 2,
    target: time >= target ? 3 : 2,
    created: time >= created ? 3 : 2,
    ready: time >= ready ? 3 : 2,
  };
}

export function endpointState(time: number) {
  const { connect, forward, received, reply, complete } = timing.service;
  if (time >= complete) return 'complete';
  if (time >= reply) return 'replying';
  if (time >= received) return 'received';
  if (time >= forward) return 'forwarding';
  if (time >= connect) return 'connecting';
  return 'idle';
}

export function registrationState(time: number) {
  const { registered, stored, running, configMap, deployment } = timing.crd;
  return {
    registered: time >= registered,
    stored: time >= stored,
    running: time >= running,
    children: time >= deployment ? 2 : time >= configMap ? 1 : 0,
  };
}

export function travel(time: number, start: number, end: number) {
  return time > start && time < end ? (time - start) / (end - start) : null;
}

export type Moment = { at: number; title: string; detail: string };
type Action = { label: string; until: number };

export type Playback = {
  duration: number;
  moments: Moment[];
  actions: Action[];
  model: string;
};

export type Pilot = Playback & { kind: 'scale' | 'service' | 'crd'; title: string; intro: string };

const { scale, service, crd } = timing;

const pilots = {
  'm05-l01-scale': {
    kind: 'scale',
    title: 'What creates the third Pod?',
    intro: 'Start with two ready Pods. Ask the Deployment for one more and follow the change to the ReplicaSet and the new Pod.',
    duration: scale.end,
    actions: [{ label: 'Scale from 2 to 3', until: scale.end }],
    moments: [
      { at: 0, title: 'Two ready Pods', detail: 'The Deployment asks for 2 replicas. Its ReplicaSet manages two Pods, and both are ready.' },
      { at: scale.desired, title: 'Deployment requests 3', detail: 'The API records replicas: 3. The Deployment controller adjusts the ReplicaSet’s target.' },
      { at: scale.target, title: 'ReplicaSet needs one more Pod', detail: 'The ReplicaSet now has a target of 3 with only 2 Pods. Its controller creates one more.' },
      { at: scale.created, title: 'The third Pod is starting', detail: 'The ReplicaSet has 3 Pods. The new Pod still has to be scheduled, start its container, and become ready.' },
      { at: scale.ready, title: 'All three Pods are ready', detail: 'The new Pod is ready. The two original Pods stayed in place throughout the scale-up.' },
    ],
    model: 'One Deployment and one active ReplicaSet. The visual shows changes observed through the API. Scheduling and startup are condensed and the timing is illustrative.',
  },
  'm06-l01-dataplane': {
    kind: 'service',
    title: 'Where does a request to a Service go?',
    intro: 'Send an HTTP request to port 8080 and follow the connection to nginx on port 80. The EndpointSlice below shows the available addresses.',
    duration: service.end,
    actions: [{ label: 'Send a request', until: service.end }],
    moments: [
      { at: 0, title: 'The Service has a ready backend', detail: 'The client already knows the Service’s virtual IP. The node has forwarding rules for its ready endpoint.' },
      { at: service.connect, title: 'Client connects to the Service address', detail: 'The client targets 10.96.0.42:8080. The node’s forwarding rules select an eligible backend.' },
      { at: service.forward, title: 'The connection is forwarded to port 80', detail: 'The node directs the connection to 10.244.1.7:80. The client sends GET / over that connection.' },
      { at: service.received, title: 'nginx receives GET /', detail: 'The ready Pod handles the request on its own IP and port.' },
      { at: service.reply, title: 'The response is on its way back', detail: 'nginx sends HTTP 200. The reply follows the established connection back to the client.' },
      { at: service.complete, title: 'The client receives HTTP 200', detail: 'One request reached a ready backend through the Service’s stable address.' },
    ],
    model: 'IPv4 ClusterIP with one ready and one unready endpoint. DNS resolution, TCP handshakes and the details of address translation are omitted. The EndpointSlice supplies endpoint data to the networking implementation.',
  },
  'm16-l01-crd-registration': {
    kind: 'crd',
    title: 'When does a WebApp become a workload?',
    intro: 'Register the API type, save one WebApp, then start its reconciler. Watch what each action adds to the cluster.',
    duration: crd.end,
    actions: [
      { label: 'Register the WebApp API', until: crd.registrationEnd },
      { label: 'Apply the WebApp', until: crd.storeEnd },
      { label: 'Start the demo reconciler', until: crd.end },
    ],
    moments: [
      { at: 0, title: 'The WebApp API is unavailable', detail: 'The CRD, WebApp instance, and reconciler are three separate parts of this example.' },
      { at: crd.registered, title: 'The API can now serve WebApps', detail: 'Once the CRD is established, the API exposes the WebApp resource and can validate instances using the schema.' },
      { at: crd.stored, title: 'WebApp m16 is stored', detail: 'The API accepts the WebApp with replicas: 1 and its message. The stored object is present while the generated resource count is still zero.' },
      { at: crd.running, title: 'The reconciler reads the stored WebApp', detail: 'The lab reconciler uses the WebApp’s spec to build ordinary Kubernetes resources.' },
      { at: crd.configMap, title: 'The reconciler writes the page', detail: 'A ConfigMap named m16 now holds the page content from the WebApp message.' },
      { at: crd.deployment, title: 'The reconciler creates the Deployment', detail: 'Deployment m16 requests one replica and refers to that ConfigMap. Its Pod still needs time to become ready.' },
    ],
    model: 'The scene condenses CRD establishment and schema validation. It models starting the lab’s Python reconciler explicitly and applying its ConfigMap and Deployment in separate writes. The generated Deployment’s rollout is outside this scene.',
  },
} satisfies Record<string, Pilot>;

export function getPilot(id: string): Pilot | undefined {
  return (pilots as Readonly<Record<string, Pilot>>)[id];
}

export function momentAt(pilot: Playback, time: number): Moment {
  return pilot.moments.findLast(moment => time >= moment.at) ?? pilot.moments[0];
}
