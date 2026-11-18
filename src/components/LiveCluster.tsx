import { useEffect,useState } from 'react';
import { Diagram } from './Diagram';
import { reconcile } from '../lib/simulations';
import type { Frame } from '../lib/scene-types';

export default function LiveCluster() {
 const [hydrated,setHydrated]=useState(false);useEffect(()=>setHydrated(true),[]);
 const [desired,setDesired]=useState(3),[pods,setPods]=useState([{id:'web-a',ready:true},{id:'web-b',ready:true},{id:'web-c',ready:true}]),[serial,setSerial]=useState(1),[message,setMessage]=useState('Three replicas are desired. Three Pods are ready. The control loop has nothing to change.');
 const observed=pods.length;const ready=pods.filter(p=>p.ready).length;
 const frame:Frame={title:'Deployment reconciliation',narration:message,nodes:[
  {id:'deployment',label:'Deployment',detail:`Desired replicas: ${desired}`,type:'control',state:'active',x:40,y:30},
  {id:'replicaset',label:'ReplicaSet',detail:`Observed Pods: ${observed}`,type:'control',state:observed===desired?'ready':'warning',x:315,y:30},
  {id:'service',label:'Service endpoints',detail:`Ready endpoints: ${ready}`,type:'service',state:ready?'ready':'warning',x:590,y:30},
  ...pods.map((p,i)=>({id:p.id,label:p.id,detail:p.ready?'Ready · serving traffic':'Running · not ready',type:'pod' as const,state:p.ready?'ready' as const:'warning' as const,x:40+(i%3)*255,y:196+Math.floor(i/3)*150})),
 ],edges:[{from:'deployment',to:'replicaset',label:'owns',state:'active'},...pods.map(p=>({from:'replicaset',to:p.id,label:'owns',state:'idle' as const}))]};
 function converge(){const next=reconcile(desired,pods,serial);setPods(next.pods.map(p=>next.created.includes(p.id)?{...p,ready:true}:p));setSerial(serial+next.created.length);setMessage(next.created.length?`The ReplicaSet created ${next.created.length} new Pod${next.created.length===1?'':'s'}. After scheduling and container startup, readiness makes them eligible as endpoints. These are new identities. Existing Pods retain their readiness.`:observed>desired?'The ReplicaSet scales down to the desired count. Termination and endpoint removal are simplified here.':'Desired and observed count already match. A readiness failure changes endpoint eligibility; the ReplicaSet does not replace a Pod just for being unready.');}
 return <div className="live-cluster" data-ui>
  <div className="live-heading"><div><span className="live-dot"/><strong>A small cluster. A real idea.</strong></div><span>Interactive model</span></div>
  <Diagram frame={frame} kind="cluster"/>
  <div className="live-state"><span><i className="desired-dot"/>Desired <strong>{desired}</strong></span><span>Observed <strong>{observed}</strong></span><span>Ready <strong>{ready}</strong></span></div>
  <div className="live-experiment"><label>Desired replicas <output>{desired}</output><input disabled={!hydrated} aria-label="Desired replicas" type="range" min="1" max="5" value={desired} onChange={e=>{setDesired(Number(e.target.value));setMessage('You changed the desired state. Kubernetes still needs to reconcile the observed state. Select Reconcile to follow the controller.');}}/></label>
   <div className="live-actions"><button type="button" className="button primary" onClick={converge}>Reconcile <span aria-hidden="true">→</span></button><button type="button" disabled={!pods.length} onClick={()=>{setPods(pods.slice(0,-1));setMessage('A Pod was deleted. The ReplicaSet observes fewer Pods than desired; a replacement will have a new identity. Select Reconcile.');}}>Delete a Pod</button><button type="button" disabled={!pods.length} onClick={()=>{setPods(pods.map((p,i)=>i? p:{...p,ready:!p.ready}));setMessage('Readiness changes whether the Pod can receive Service traffic. It does not restart its container or change the ReplicaSet replica count.');}}>Toggle readiness</button></div>
  </div>
  <p className="live-narration" aria-live="polite">{message}</p>
  <details className="model-note"><summary>Model boundaries</summary><p>Reconciliation is explicit here so you can inspect the gap. Real controllers run asynchronously. Scheduling, readiness delays, graceful deletion, and EndpointSlice updates are compressed into one action.</p></details>
 </div>;
}
