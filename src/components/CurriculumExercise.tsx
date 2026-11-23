import { useState } from 'react';

export type ExerciseKind = 'hpa' | 'quorum';

function HpaExample() {
  const [usage, setUsage] = useState(75);
  const replicas = 4;
  const target = 50;
  const request = 200;
  const measured = request * usage / 100;
  const recommendation = Math.ceil(replicas * usage / target);
  return (
    <section className="curriculum-exercise" aria-label="HPA estimate">
      <label>
        Change average CPU utilization
        <input type="range" min="25" max="100" step="5" value={usage} onChange={event => setUsage(Number(event.currentTarget.value))} />
      </label>
      <dl>
        <div><dt>Current replicas</dt><dd>{replicas}</dd></div>
        <div><dt>CPU utilization</dt><dd>{usage}%<small>{measured}m used ÷ {request}m requested</small></dd></div>
        <div><dt>Target utilization</dt><dd>{target}%</dd></div>
      </dl>
      <output className="curriculum-exercise-outcome">ceil({replicas} × {usage}% ÷ {target}%) = <strong>{recommendation} replicas</strong></output>
      <p>Base recommendation only. The HPA can also apply tolerance, bounds, stabilization, and rate limits.</p>
    </section>
  );
}

export function HpaRequestComparison() {
  const [hasRequest, setHasRequest] = useState(false);
  const measured = 80;
  const request = 100;
  const replicas = 3;
  const target = 50;
  const utilization = measured / request * 100;
  const recommendation = Math.ceil(replicas * utilization / target);

  return (
    <section className="curriculum-exercise" aria-label="CPU request comparison">
      <label>
        <input type="checkbox" checked={hasRequest} onChange={event => setHasRequest(event.currentTarget.checked)} />
        <span>Set CPU request to {request}m</span>
      </label>
      <dl>
        <div><dt>CPU usage per Pod</dt><dd>{measured}m</dd></div>
        <div><dt>CPU request per Pod</dt><dd>{hasRequest ? request + 'm' : 'Missing'}</dd></div>
        <div><dt>CPU utilization</dt><dd>{hasRequest ? utilization + '%' : 'Undefined'}</dd></div>
      </dl>
      <output className="curriculum-exercise-outcome">
        {hasRequest ? (
          <>ceil({replicas} × {utilization}% ÷ {target}%) = <strong>{recommendation} replicas</strong></>
        ) : (
          <strong>No CPU-based recommendation</strong>
        )}
      </output>
      <p>CPU utilization divides usage by the CPU request. This base estimate uses {replicas} replicas, a {target}% target, and CPU utilization as the only metric.</p>
    </section>
  );
}

function QuorumExample() {
  const [available, setAvailable] = useState(3);
  const voters = 3;
  const majority = Math.floor(voters / 2) + 1;
  return (
    <section className="curriculum-exercise" aria-label="etcd majority">
      <label>
        Available voting members
        <input type="range" min="0" max={voters} value={available} onChange={event => setAvailable(Number(event.currentTarget.value))} />
      </label>
      <ul className="curriculum-voters" aria-label="Configured etcd voters">
        {Array.from({ length: voters }, (_, voter) => (
          <li key={voter} data-available={voter < available}>Voter {voter + 1}<span>{voter < available ? 'Available' : 'Unavailable'}</span></li>
        ))}
      </ul>
      <output className="curriculum-exercise-outcome"><strong>{available} / {voters} available.</strong> {available >= majority ? 'Majority present. Writes can commit.' : 'Majority lost. New writes cannot commit.'}</output>
      <p>The majority remains {majority} because the cluster has {voters} configured voters. Available voters can communicate in this example.</p>
    </section>
  );
}

export default function CurriculumExercise({ kind }: { kind: ExerciseKind }) {
  return kind === 'hpa' ? <HpaExample /> : <QuorumExample />;
}
