import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Scene } from '../lib/scene-types';
import { Diagram, DiagramLinks } from './Diagram';
import SelectControl from './SelectControl';
import {diagramLayout} from '../lib/diagram-layout';
import MechanismExperiment, {type ExperimentKind} from './MechanismExperiment';

export default function ScenePlayer({scene,experiment}:{scene:Scene;experiment?:ExperimentKind}) {
 const [hydrated,setHydrated]=useState(false);useEffect(()=>setHydrated(true),[]);
 const [step,setStep]=useState(0),[variant,setVariant]=useState('default'),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[visible,setVisible]=useState(false),[message,setMessage]=useState('');
 const stage=useRef<HTMLDivElement>(null);const prefersReducedMotion=useReducedMotion();
 // Match the server until hydration; controls remain disabled during this handoff.
 const reduced=hydrated&&prefersReducedMotion;
 const chosen=scene.variants?.find(v=>v.id===variant);const frames=chosen?.frames??scene.frames;const frame=frames[Math.min(step,frames.length-1)];
 const layout=useMemo(()=>diagramLayout([...scene.frames,...(scene.variants??[]).flatMap(item=>item.frames)]),[scene]);
 useEffect(()=>{const query=new URLSearchParams(location.search);if(query.get('scene')!==scene.id)return;const v=query.get('variant');const selected=scene.variants?.find(x=>x.id===v);if(selected)setVariant(selected.id);const n=Number(query.get('step')??0);if(Number.isInteger(n)&&n>=0)setStep(Math.min(n,(selected?.frames??scene.frames).length-1));},[scene]);
 useEffect(()=>{const observer=new IntersectionObserver(([entry])=>{setVisible(entry.isIntersecting);if(!entry.isIntersecting)setPlaying(false);},{threshold:0});if(stage.current)observer.observe(stage.current);const pause=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',pause);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',pause);};},[]);
 useEffect(()=>{if(!playing||!visible||reduced||step>=frames.length-1)return;const timer=setTimeout(()=>setStep(step+1),3500/speed);return()=>clearTimeout(timer);},[playing,visible,reduced,speed,step,frames.length]);
 useEffect(()=>{if(step===frames.length-1)setPlaying(false);},[step,frames.length]);
 function play(){if(reduced){setStep(s=>(s+1)%frames.length);return;}if(step===frames.length-1)setStep(0);if(!playing&&!visible)stage.current?.scrollIntoView({block:'nearest'});setPlaying(!playing);}
 const select=(id:string)=>{setVariant(id);setStep(0);setPlaying(false);};
 async function share(){const url=new URL(location.href);url.searchParams.set('scene',scene.id);url.searchParams.set('variant',variant);url.searchParams.set('step',String(step));url.hash=`scene-${scene.id}`;try{await navigator.clipboard.writeText(url.href);setMessage('Link copied to this scene and step.');}catch{setMessage(url.href);}}
 return <div className="scene-player" data-scene={scene.id}>
  <div ref={stage} className="scene-stage"><div className="stage-caption"><span>{scene.kind==='cluster'?'Cluster view':`${scene.kind.charAt(0).toUpperCase()+scene.kind.slice(1)} view`}</span><span>Step {step+1} of {frames.length}</span></div><Diagram frame={frame} kind={scene.kind} layout={layout} speed={speed} showLinks={false}/></div>
  <fieldset className="scene-controls" disabled={!hydrated}>
   <legend className="sr-only">Animation controls</legend>
   <button type="button" className="play-button" onClick={play} aria-label={reduced?'Advance animation one step':playing?'Pause animation':'Play animation'}>{reduced?'Advance':playing?'Pause':'Play'}<span aria-hidden="true">{playing?'Ⅱ':'▷'}</span></button>
   <button type="button" onClick={()=>{setPlaying(false);setStep(Math.max(0,step-1));}} disabled={step===0}>Back</button>
   <button type="button" onClick={()=>{setPlaying(false);setStep(Math.min(frames.length-1,step+1));}} disabled={step===frames.length-1}>Next</button>
   <button type="button" onClick={()=>{setPlaying(false);setStep(0);}}>Reset</button>
   <SelectControl label="Speed" value={String(speed)} options={[{value:'0.5',label:'0.5×'},{value:'1',label:'1×'},{value:'2',label:'2×'}]} onChange={value=>setSpeed(Number(value))} disabled={!hydrated||!!reduced} compact className="speed-control"/>
   <button type="button" className="share-scene" onClick={share}>Share</button>
  </fieldset>
  <label className="timeline"><span className="sr-only">Animation step</span><input disabled={!hydrated} type="range" min="0" max={frames.length-1} value={step} onChange={e=>{setPlaying(false);setStep(Number(e.target.value));}} aria-valuetext={`Step ${step+1}: ${frame.title}`}/></label>
  {!!scene.variants?.length&&<SelectControl label="Explore a scenario" value={variant} options={[{value:'default',label:'Normal behavior'},...scene.variants.map(item=>({value:item.id,label:item.label}))]} onChange={select} disabled={!hydrated} className="scenario-choice"/>}
  <div className="scene-narration" aria-live="polite" aria-atomic="true"><strong>{frame.title}</strong><p>{frame.narration}</p>{chosen&&<p className="variant-note">{chosen.description}</p>}</div>
  {!!frame.edges?.length&&<div className="scene-narration scene-relationships"><DiagramLinks frame={frame}/></div>}
  {frame.code&&<details className="scene-code"><summary>Inspect this state in YAML / kubectl</summary><pre><code>{frame.code}</code></pre></details>}
  <details className="scene-transcript"><summary>Read the complete visual sequence</summary><ol>{scene.frames.map((f,i)=><li key={i}><strong>{f.title}</strong><p>{f.narration}</p></li>)}</ol>{scene.variants?.map(v=><section key={v.id}><h4>{v.label}</h4><p>{v.description}</p><ol>{v.frames.map((f,i)=><li key={i}><strong>{f.title}</strong><p>{f.narration}</p></li>)}</ol></section>)}</details>
  <details className="model-note"><summary>About this model</summary><p>{scene.assumption}</p></details>
  {experiment&&<MechanismExperiment kind={experiment}/>}
  {message&&<p className="share-message" role="status">{message}</p>}
  <noscript><p>This is the first annotated state. The complete step-by-step explanation follows in the lesson; enable JavaScript to operate the controls.</p></noscript>
 </div>;
}
