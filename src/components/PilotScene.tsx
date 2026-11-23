import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { momentAt, type Pilot, type Playback } from '../lib/pilot-scenes';
import { RegistrationVisual, ScaleVisual, ServiceVisual } from './PilotVisuals';

const visuals = { scale: ScaleVisual, service: ServiceVisual, crd: RegistrationVisual };

export default function PilotScene({ id, pilot }: { id: string; pilot: Pilot }) {
  const Visual = visuals[pilot.kind];
  return <Demonstration pilot={pilot} id={id}>{time => <Visual time={time} />}</Demonstration>;
}

export function Demonstration({ pilot, id, inlineSteps = false, children }: {
  pilot: Playback;
  id: string;
  inlineSteps?: boolean;
  children: (time: number) => ReactNode;
}) {
  const [position, setPosition] = useState(0);
  const [destination, setDestination] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const time = useRef(0);
  const graphic = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const moment = momentAt(pilot, position);
  const action = pilot.actions.find(item => position < item.until) ?? pilot.actions[0];
  const complete = position === pilot.duration;
  const playing = destination !== null;
  const checkpoints = pilot.actions.length > 1
    ? pilot.actions.map(item => item.until)
    : pilot.moments.map(item => item.at);

  useEffect(() => {
    setHydrated(true);
    const element = graphic.current;
    if (!element) return;
    let wasVisible = false;
    const observer = new IntersectionObserver(entries => {
      for (const { isIntersecting } of entries) {
        if (wasVisible && !isIntersecting) setDestination(null);
        wasVisible = isIntersecting;
      }
    });
    observer.observe(element);
    function pauseHidden() {
      if (document.hidden) setDestination(null);
    }
    document.addEventListener('visibilitychange', pauseHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', pauseHidden);
    };
  }, []);

  useEffect(() => {
    if (destination === null || reduced) return;
    const end = destination;
    let frame: number;
    let previous: number | undefined;

    function advance(now: number) {
      const elapsed = previous === undefined ? 0 : Math.min(now - previous, 80);
      previous = now;
      const next = Math.min(end, time.current + elapsed);
      time.current = next;
      setPosition(next);
      if (next === end) setDestination(null);
      else frame = requestAnimationFrame(advance);
    }

    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [destination, reduced]);

  useEffect(() => {
    if (reduced) setDestination(null);
  }, [reduced]);

  function seek(next: number) {
    setDestination(null);
    time.current = next;
    setPosition(next);
  }

  function start(end: number) {
    if (complete) seek(0);
    if (reduced) {
      seek(end);
      return;
    }
    const rect = graphic.current?.getBoundingClientRect();
    if (rect && (rect.top >= window.innerHeight || rect.bottom <= 0)) {
      graphic.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    setDestination(end);
  }

  function toggle() {
    if (playing) setDestination(null);
    else start(action.until);
  }

  return (
    <div className="pilot-scene" data-scene={id}>
      <div className="pilot-controls">
        <button type="button" className="pilot-primary" onClick={toggle} disabled={!hydrated}>
          <span aria-hidden="true">{playing ? 'Ⅱ' : complete ? '↻' : '▷'}</span>
          {playing ? 'Pause' : complete ? 'Replay' : action.label}
        </button>
        {pilot.actions.length > 1 && (
          <button type="button" className="pilot-secondary" onClick={() => start(pilot.duration)} disabled={!hydrated || playing}>Play all</button>
        )}
        <button type="button" className="pilot-secondary" onClick={() => seek(0)} disabled={!hydrated || position === 0}>Reset</button>
      </div>
      <div ref={graphic} className="pilot-graphic">
        {children(position)}
      </div>
      <div className={inlineSteps ? "sr-only" : "pilot-readout"} aria-live="polite" aria-atomic="true">
        <strong>{moment.title}</strong>
        <p>{moment.detail}</p>
      </div>
      <label className="pilot-timeline">
        <span>Demonstration timeline</span>
        <input
          type="range" min={0} max={pilot.duration} step={1}
          value={Math.round(position)} aria-valuetext={moment.title} disabled={!hydrated}
          onChange={event => seek(Number(event.currentTarget.value))}
          onKeyDown={event => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
              event.preventDefault();
              seek(checkpoints.find(at => at > position) ?? pilot.duration);
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
              event.preventDefault();
              seek(checkpoints.findLast(at => at < position) ?? 0);
            }
          }}
        />
      </label>
      {inlineSteps ? <p className="lesson-visual-note">{pilot.model}</p> : (
        <details className="pilot-transcript">
          <summary>Text walkthrough</summary>
          <ol>{pilot.moments.map(item => <li key={item.at}><strong>{item.title}</strong><p>{item.detail}</p></li>)}</ol>
          <p>{pilot.model}</p>
        </details>
      )}
    </div>
  );
}
