import type { CSSProperties, ReactNode } from 'react';
import { endpointState, registrationState, scaleState, timing, travel } from '../lib/pilot-scenes';

function Transit({ label, position, vertical = false, reverse = false }: {
  label: string;
  position: number | null;
  vertical?: boolean;
  reverse?: boolean;
}) {
  return (
    <div className={'pilot-link' + (vertical ? ' pilot-link--down' : '')} data-traveling={position !== null || undefined} data-reply={reverse || undefined}>
      <span className="pilot-link-label">{label}</span>
      <span className="pilot-link-line" aria-hidden="true">
        <span className="pilot-link-arrow" />
        {position !== null && (
          <span className="pilot-token" data-reply={reverse || undefined} style={{ '--travel': reverse ? 1 - position : position } as CSSProperties} />
        )}
      </span>
    </div>
  );
}

function Box({ kind, name, children, tone }: { kind: string; name: string; children: ReactNode; tone?: 'blue' | 'ready' }) {
  return (
    <div className="pilot-object" data-tone={tone}>
      <span className="pilot-kind">{kind}</span>
      <strong>{name}</strong>
      <span className="pilot-object-detail">{children}</span>
    </div>
  );
}

function Pod({ name, status }: { name: string; status: 'Ready' | 'Starting' | 'Empty slot' }) {
  return (
    <li className="pilot-pod" data-state={status}>
      <span className="pilot-pod-mark" aria-hidden="true"><i /><i /><i /></span>
      <span><strong>{name}</strong><span className="pilot-pod-state">{status}</span></span>
    </li>
  );
}

export function ScaleVisual({ time }: { time: number }) {
  const { desired, target, created, ready } = scaleState(time);
  const t = timing.scale;
  return (
    <div className="pilot-scale">
      <dl className="pilot-counts" aria-label="Replica counts">
        <div><dt>Desired</dt><dd>{desired}</dd></div>
        <div><dt>Pods created</dt><dd>{created}</dd></div>
        <div><dt>Ready</dt><dd>{ready}</dd></div>
      </dl>
      <div className="pilot-route pilot-scale-route">
        <Box kind="Deployment" name="replicas-demo" tone={desired === 3 ? 'blue' : undefined}>Desired <b>{desired}</b></Box>
        <Transit label={desired === 3 ? 'Set target to 3' : 'Sets the target'} position={travel(time, t.request, t.target)} />
        <Box kind="ReplicaSet" name="web replicas" tone={target > created ? 'blue' : undefined}>Target <b>{target}</b></Box>
      </div>
      <div className="pilot-scale-ownership">
        <Transit label={target === 3 ? 'Create Pod C' : 'Maintains these Pods'} position={travel(time, t.creating, t.created)} vertical />
      </div>
      <div className="pilot-pod-group">
        <span>Pods managed by this ReplicaSet</span>
        <ul className="pilot-pods" aria-label="Pods managed by this ReplicaSet">
          <Pod name="Pod A" status="Ready" />
          <Pod name="Pod B" status="Ready" />
          <Pod name="Pod C" status={ready === 3 ? 'Ready' : created === 3 ? 'Starting' : 'Empty slot'} />
        </ul>
      </div>
    </div>
  );
}

export function ServiceVisual({ time }: { time: number }) {
  const stage = endpointState(time);
  const t = timing.service;
  const reverse = stage === 'replying';
  const first = reverse ? travel(time, 5440, t.complete) : travel(time, t.connect, t.forward);
  const second = reverse ? travel(time, t.reply, 5440) : travel(time, t.forward, t.received);
  return (
    <div className="pilot-service">
      <div className="pilot-route pilot-service-route">
        <Box kind="Client Pod" name="service-client" tone={stage === 'complete' ? 'ready' : undefined}>
          {stage === 'complete' ? 'HTTP 200 received' : 'Requests GET /'}
        </Box>
        <Transit label={reverse ? 'HTTP 200' : 'Connect'} position={first} reverse={reverse} />
        <Box kind="Service address" name="10.96.0.42:8080" tone="blue">Node forwarding rules</Box>
        <Transit label={reverse ? 'HTTP 200' : 'Forward to :80'} position={second} reverse={reverse} />
        <Box kind="Backend Pod" name="10.244.1.7:80" tone="ready">
          {stage === 'received' ? 'Handling GET /' : reverse || stage === 'complete' ? 'nginx replied' : 'nginx · Ready'}
        </Box>
      </div>
      <div className="pilot-endpoints">
        <header><strong>EndpointSlice</strong><span>Used to program the node’s forwarding rules</span></header>
        <ul aria-label="EndpointSlice addresses">
          <li><code>10.244.1.7:80</code><span data-status="ready">Ready · eligible</span></li>
          <li><code>10.244.2.9:80</code><span>Not ready · skipped</span></li>
        </ul>
      </div>
    </div>
  );
}

export function RegistrationVisual({ time }: { time: number }) {
  const { registered, stored, running, children } = registrationState(time);
  const t = timing.crd;
  const incoming = travel(time, 400, t.registered) ?? travel(time, t.registrationEnd + 400, t.stored);
  const reading = travel(time, t.running, t.configMap);
  return (
    <div className="pilot-registration">
      <div className="pilot-register-api">
        <header><strong>API server</strong><span>labs.kv.example/v1alpha1</span></header>
        <div className="pilot-ledger-row" data-present={registered}>
          <span>Served type</span><strong>{registered ? 'WebApp' : 'None registered'}</strong>
        </div>
        <div className="pilot-ledger-row" data-present={stored}>
          <span>Stored object</span><strong>{stored ? 'WebApp/m16' : 'None stored'}</strong>
        </div>
        <div className="pilot-ledger-spec" data-present={stored}>{stored ? 'spec.replicas: 1' : 'Waiting for a WebApp manifest'}</div>
        {incoming !== null && (
          <span className="pilot-ledger-write" style={{ '--travel': incoming } as CSSProperties } aria-hidden="true">
            {registered ? 'WebApp YAML' : 'CRD schema'}
          </span>
        )}
      </div>
      <Transit label={running ? 'Read WebApp spec' : 'Reads the stored WebApp'} position={reading} />
      <div className="pilot-register-children">
        <header><strong>Demo reconciler</strong><span data-status={running ? 'ready' : undefined}>{running ? 'Running' : 'Stopped'}</span></header>
        <div className="pilot-resource-count"><span>Generated resources</span><b>{children}</b></div>
        <ul aria-label={'Generated resources: ' + children}>
          {['ConfigMap', 'Deployment'].map((kind, index) => (
            <li key={kind} data-present={children > index}><strong>{kind}</strong><span>{children > index ? 'm16' : '—'}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
