import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { Frame, Scene } from '../lib/scene-types';
import type { VisualStory, Beat } from '../lib/lesson-visual-types';
import { getPilot, type Playback } from '../lib/pilot-scenes';
import PilotScene, { Demonstration } from './PilotScene';
import CurriculumExercise, { HpaRequestComparison } from './CurriculumExercise';
import MechanismExperiment, { type ExperimentKind } from './MechanismExperiment';
import CodeBlock from './CodeBlock';

const beatLength = 1500;

function buildPlayback(run: NonNullable<VisualStory['run']>, takeaway: string, model: string): Playback {
  const { beats, action } = run;
  const duration = beats.length * beatLength + 400;
  return {
    duration,
    actions: [{ label: action, until: duration }],
    moments: [
      { at: 0, title: 'Follow the sequence', detail: takeaway },
      ...beats.map(([, action, , result], index) => ({ at: (index + 1) * beatLength, title: action, detail: result })),
    ],
    model,
  };
}

function Route({ beats, time }: { beats: readonly Beat[]; time: number }) {
  return (
    <ol className="lesson-route" aria-label="Action and result at each stage">
      {beats.map(([from, verb, to, result], index) => {
        const progress = Math.max(0, Math.min(1, (time - index * beatLength) / beatLength));
        return (
          <li key={index} className="lesson-route-row" data-arrived={progress === 1}>
            <div className="lesson-route-end">
              <span className="lesson-route-name">{from}</span>
              <span className="lesson-route-label">{verb}</span>
            </div>
            <span className="lesson-route-connector" aria-hidden="true">
              {progress > 0 && progress < 1 && <span className="lesson-route-message" style={{ '--position': progress } as CSSProperties} />}
            </span>
            <div className="lesson-route-end">
              <span className="lesson-route-name">{to}</span>
              <span className="lesson-route-result">{result}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Reference({ frames, panels, currentStep }: { frames: Frame[]; panels?: readonly string[]; currentStep?: number }) {
  return (
    <ol className="lesson-reference" data-columns={frames.length === 3 ? 'three' : 'two'} aria-label="Visual explanation">
      {frames.map((frame, index) => {
        const nodes = new Map(frame.nodes.map(node => [node.id, node]));
        const connected = new Set(frame.edges?.flatMap(edge => [edge.from, edge.to]));
        const facts = connected.size
          ? frame.nodes.filter(node => !connected.has(node.id) && node.state && node.state !== 'idle')
          : frame.nodes;
        return (
          <li key={index} className="lesson-reference-panel" aria-current={index === currentStep ? 'step' : undefined}>
            <h4>{panels?.[index] ?? frame.title}</h4>
            {!!facts.length && <ul className="lesson-reference-nodes">
              {facts.map(node => (
                <li key={node.id} data-node-state={node.state}>
                  <strong>{node.label}</strong>
                  {node.detail && <span>{node.detail}</span>}
                </li>
              ))}
            </ul>}
            {!!frame.edges?.length && (
              <ul className="lesson-reference-links">
                {frame.edges.map(edge => (
                  <li key={edge.from + ':' + edge.to + ':' + edge.label}>
                    <span>{nodes.get(edge.from)?.label}</span>
                    <span className="lesson-reference-arrow" aria-hidden="true">{edge.state === 'blocked' ? '╪' : '→'}</span>
                    <span>{nodes.get(edge.to)?.label}</span>
                    {edge.label && <small>{edge.label}</small>}
                  </li>
                ))}
              </ul>
            )}
            {!!frame.metrics?.length && <dl className="lesson-reference-metrics">
              {frame.metrics.map(metric => <div key={metric.label}>
                <dt>{metric.label}</dt>
                <dd><span>{metric.value}{metric.unit} / {metric.max}{metric.unit}</span>
                  <meter value={metric.value} max={metric.max} aria-label={metric.label} />
                </dd>
              </div>)}
            </dl>}
            <p>{frame.narration}</p>
          </li>
        );
      })}
    </ol>
  );
}

type Selection = { variant?: string; step?: number };

function readSelection(scene: Scene, search: string): Selection {
  const query = new URLSearchParams(search);
  if (query.get('scene') !== scene.id) return {};

  const variantId = query.get('variant');
  const variant = scene.variants?.find(entry => entry.id === variantId);
  if (variantId && variantId !== 'default' && !variant) return {};

  const savedStep = query.get('step');
  const number = Number(savedStep);
  const frames = variant?.frames ?? scene.frames;
  const step = savedStep !== null && savedStep.trim() && Number.isSafeInteger(number) && number >= 0
    ? Math.min(number, frames.length - 1)
    : undefined;
  return { variant: variant?.id, step };
}

function caseLink(sceneId: string, variant: string) {
  return '?' + new URLSearchParams({ scene: sceneId, variant }) + '#scene-' + sceneId;
}

export default function CurriculumScene({ scene, story, experiment }: {
  scene: Scene;
  story?: VisualStory;
  experiment?: ExperimentKind;
}) {
  const [selection, setSelection] = useState<Selection>({});
  const content = useRef<HTMLDivElement>(null);
  const caseHeading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const pilot = getPilot(scene.id);

  useEffect(() => {
    const update = () => setSelection(readSelection(scene, window.location.search));
    update();
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, [scene]);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const target = caseHeading.current ?? content.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [selection]);

  function selectCase(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const link = new URL(event.currentTarget.href);
    if (link.href !== window.location.href) window.history.pushState(null, '', link);
    moveFocus.current = true;
    setSelection(readSelection(scene, link.search));
  }

  const variant = scene.variants?.find(entry => entry.id === selection.variant);
  const otherVariants = scene.variants?.filter(entry => entry.id !== selection.variant) ?? [];
  const caseOpen = !!variant || selection.step !== undefined;
  const frames = variant?.frames ?? scene.frames;
  const codeFrames = frames.flatMap(frame => frame.code ? [{ title: frame.title, code: frame.code }] : []);
  const run = story?.run;

  return (
    <>
      <div className="lesson-visual-content" ref={content} tabIndex={-1}>
        {caseOpen ? (
          <section className="pilot-scene lesson-visual-case" aria-labelledby={scene.id + '-case-title'}>
            <div className="lesson-case-header">
              <h4 id={scene.id + '-case-title'} tabIndex={-1} ref={caseHeading}>
                {variant?.label ?? 'Saved sequence'}
              </h4>
              <a href={caseLink(scene.id, 'default')} onClick={selectCase}>Back to the main visual</a>
            </div>
            <p className="lesson-case-description">{variant?.description ?? scene.description}</p>
            {story?.exercise === 'hpa' && variant?.id === 'failure' && <HpaRequestComparison />}
            <Reference frames={frames} currentStep={selection.step} />
            <p className="lesson-visual-note">{scene.assumption}</p>
          </section>
        ) : pilot ? (
          <PilotScene id={scene.id} pilot={pilot} />
        ) : run && story ? (
          <Demonstration pilot={buildPlayback(run, story.takeaway, scene.assumption)} id={scene.id} inlineSteps>
            {time => <Route beats={run.beats} time={time} />}
          </Demonstration>
        ) : (
          <div className="pilot-scene">
            {story?.exercise ? <CurriculumExercise kind={story.exercise} /> : <Reference frames={frames} panels={story?.panels} />}
            <p className="lesson-visual-note">{scene.assumption}</p>
          </div>
        )}
      </div>
      {(codeFrames.length > 0 || otherVariants.length > 0 || experiment) && (
        <div className="lesson-visual-extras">
          {experiment && <MechanismExperiment kind={experiment} />}
          {codeFrames.length > 0 && (
            <details>
              <summary>Inspect YAML or commands</summary>
              {codeFrames.map(frame => <div key={frame.title}><p>{frame.title}</p><CodeBlock code={frame.code} /></div>)}
            </details>
          )}
          {otherVariants.length > 0 && (
            <details>
              <summary>Explore another case</summary>
              <ul>
                {otherVariants.map(entry => (
                  <li key={entry.id}>
                    <a href={caseLink(scene.id, entry.id)} onClick={selectCase}>
                      {entry.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </>
  );
}
