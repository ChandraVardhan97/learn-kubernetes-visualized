import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { EventTrace, TraceEvent } from '../data/event-traces';
import type { Playback } from '../lib/pilot-scenes';
import { Demonstration } from './PilotScene';

const eventLength = 1750;

function eventLink(sceneId: string, eventId: string) {
  return '?' + new URLSearchParams({ scene: sceneId, event: eventId }) + '#trace-' + sceneId;
}

function CopyEventLink({ href, disabled }: { href: string; disabled: boolean }) {
  const [result, setResult] = useState<{ href: string; manualUrl?: string }>();
  const feedback = result?.href === href ? result : undefined;

  async function copyEventLink() {
    const url = new URL(href, window.location.href).href;
    try {
      await navigator.clipboard.writeText(url);
      setResult({ href });
    } catch {
      setResult({ href, manualUrl: url });
    }
  }

  return (
    <div className="trace-share">
      <button type="button" onClick={copyEventLink} disabled={disabled}>Copy event link</button>
      <span className="trace-copy-status" role="status">
        {feedback && (feedback.manualUrl ? 'Select and copy the URL.' : 'Link copied')}
      </span>
      {feedback?.manualUrl && (
        <input
          aria-label="Event link URL"
          value={feedback.manualUrl}
          readOnly
          onFocus={event => event.currentTarget.select()}
        />
      )}
    </div>
  );
}

function TraceMap({ trace, event, progress, compact = false }: {
  trace: EventTrace;
  event: TraceEvent;
  progress: number;
  compact?: boolean;
}) {
  const actors = Object.entries(trace.actors).map(([id, actor], index) => ({
    ...actor, id,
    x: compact ? 98 + index % 2 * 188 : actor.x,
    y: compact ? 42 + Math.floor(index / 2) * 76 : actor.y,
  }));
  const sender = actors.find(actor => actor.id === event.from)!;
  const receiver = actors.find(actor => actor.id === event.to)!;
  const dx = receiver.x - sender.x;
  const dy = receiver.y - sender.y;
  const inset = Math.min(87 / Math.abs(dx), 27 / Math.abs(dy));
  const x1 = sender.x + dx * inset;
  const y1 = sender.y + dy * inset;
  const x2 = receiver.x - dx * inset;
  const y2 = receiver.y - dy * inset;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  return (
    <svg className={compact ? 'trace-map trace-map--compact' : 'trace-map trace-map--wide'} viewBox={compact ? `0 0 384 ${Math.ceil(actors.length / 2) * 76 + 8}` : '0 0 640 220'} aria-hidden="true">
      {!compact && <line className="trace-map-divider" x1="18" x2="622" y1="110" y2="110" />}
      <line className="trace-connection" x1={x1} y1={y1} x2={x2} y2={y2} />
      {actors.map(actor => (
        <g key={actor.id} className="trace-node" data-active={actor.id === event.from || actor.id === event.to} transform={`translate(${actor.x} ${actor.y})`}>
          <rect x="-87" y="-27" width="174" height="54" rx="9" />
          <text textAnchor="middle" y="-2">{actor.label}</text>
          <text className="trace-node-context" textAnchor="middle" y="15">{actor.area}</text>
        </g>
      ))}
      <path className="trace-arrowhead" d="M-8 -4 L-1 0 L-8 4" transform={`translate(${x2} ${y2}) rotate(${angle})`} />
      {progress > 0 && progress < 1 && (
        <circle className="trace-pulse" cx={x1 + (x2 - x1) * progress} cy={y1 + (y2 - y1) * progress} r="5" />
      )}
    </svg>
  );
}

function TraceDiagram({ trace, event, progress }: { trace: EventTrace; event: TraceEvent; progress: number }) {
  return (
    <div className="trace-diagram">
      <TraceMap trace={trace} event={event} progress={progress} />
      <TraceMap trace={trace} event={event} progress={progress} compact />
      <p className="trace-direction">
        <span><small>From</small> <strong>{trace.actors[event.from].label}</strong></span>
        <span aria-hidden="true">→</span>
        <span><small>To</small> <strong>{trace.actors[event.to].label}</strong></span>
      </p>
    </div>
  );
}

export default function TraceExplorer({ sceneId, trace }: { sceneId: string; trace: EventTrace }) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  const [selection, setSelection] = useState({ start: 0, revision: 0 });
  const [view, setView] = useState<'diagram' | 'sequence'>('diagram');
  const traceId = 'trace-' + sceneId;
  const duration = trace.events.length * eventLength;
  const playback: Playback = {
    duration,
    actions: [{ label: 'Play trace', until: duration }],
    moments: trace.events.map((event, index) => ({ at: index * eventLength, title: event.title, detail: event.detail })),
    model: trace.model,
  };

  useEffect(() => {
    function restore() {
      const params = new URLSearchParams(window.location.search);
      const index = params.get('scene') === sceneId
        ? trace.events.findIndex(event => event.id === params.get('event'))
        : -1;
      if (index >= 0 && disclosure.current) disclosure.current.open = true;
      setSelection(previous => ({ start: Math.max(index, 0) * eventLength, revision: previous.revision + 1 }));
    }

    if (window.location.search) restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [sceneId, trace]);

  function choose(index: number, seek: (position: number) => void) {
    const href = eventLink(sceneId, trace.events[index].id);
    if (new URL(href, window.location.href).href !== window.location.href) {
      window.history.pushState(null, '', href);
    }
    seek(index * eventLength);
  }

  function follow(event: MouseEvent<HTMLAnchorElement>, index: number, seek: (position: number) => void) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    choose(index, seek);
  }

  return (
    <details className="trace-explorer" id={traceId} ref={disclosure}>
      <summary>{trace.label}</summary>
      <div className="trace-body">
        <p className="trace-scope">{trace.scope}</p>
        <Demonstration key={selection.revision} pilot={playback} id={traceId} initialPosition={selection.start} inlineSteps>
          {(time, seek, hydrated) => {
            const index = Math.min(Math.floor(time / eventLength), trace.events.length - 1);
            const event = trace.events[index];
            const progress = (time - index * eventLength) / eventLength;
            return (
              <>
                <div className="trace-toolbar">
                  <div className="trace-views" role="group" aria-label="Trace view">
                    <button type="button" aria-pressed={view === 'diagram'} onClick={() => setView('diagram')} disabled={!hydrated}>Diagram</button>
                    <button type="button" aria-pressed={view === 'sequence'} onClick={() => setView('sequence')} disabled={!hydrated}>Sequence</button>
                  </div>
                  <div className="trace-paging" role="group" aria-label="Event navigation">
                    <button type="button" disabled={!hydrated || index === 0} onClick={() => choose(index - 1, seek)} aria-label="Previous event">←</button>
                    <span>{index + 1} / {trace.events.length}</span>
                    <button type="button" disabled={!hydrated || index === trace.events.length - 1} onClick={() => choose(index + 1, seek)} aria-label="Next event">→</button>
                  </div>
                </div>
                {view === 'diagram' ? <TraceDiagram trace={trace} event={event} progress={progress} /> : (
                  <ol className="trace-sequence" aria-label="Events in order">
                    {trace.events.map((item, position) => (
                      <li key={item.id}>
                        <a href={eventLink(sceneId, item.id)} aria-current={position === index ? 'step' : undefined} onClick={click => follow(click, position, seek)}>
                          <strong>{item.title}</strong>
                          <span>{trace.actors[item.from].label} → {trace.actors[item.to].label}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
                <section className="trace-evidence" aria-label="Event evidence">
                  <div className="trace-evidence-heading">
                    <h4>{event.title}</h4>
                    <CopyEventLink href={eventLink(sceneId, event.id)} disabled={!hydrated} />
                  </div>
                  <p>{event.detail}</p>
                  <div className="trace-change">
                    <strong>{event.field}</strong>
                    <dl>
                      <div><dt>Before</dt><dd>{event.before}</dd></div>
                      <div><dt>After</dt><dd>{event.after}</dd></div>
                    </dl>
                  </div>
                </section>
              </>
            );
          }}
        </Demonstration>
        <div className="trace-lab">
          <strong>{trace.lab.question}</strong>
          <details><summary>Reveal prediction answer</summary><p>{trace.lab.answer}</p></details>
          <p>{trace.lab.check}</p>
          <a href={trace.lab.href}>{trace.lab.label} <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </details>
  );
}
