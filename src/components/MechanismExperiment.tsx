import {useState} from 'react';
import {authorize,bindVolume,endpoints,operatorPlan,schedule} from '../lib/simulations';
import type {Frame} from '../lib/scene-types';
import {Diagram} from './Diagram';
export type ExperimentKind='scheduling'|'endpoints'|'storage'|'authorization'|'operator';
export default function MechanismExperiment({kind}:{kind:ExperimentKind}){
 const [value,setValue]=useState(1),[flag,setFlag]=useState(false),[second,setSecond]=useState(false);
 let frame:Frame;let code='';let controls;
 if(kind==='scheduling'){
  const result=schedule({request:value,limit:4,requiresGPU:flag},[{id:'worker-a',available:2,gpu:false},{id:'worker-b',available:1,gpu:true}]);
  frame={title:result.node?`Bind to ${result.node}`:'Keep the Pod Pending',narration:`${result.reason}. This model picks the first feasible example node; Kubernetes also scores feasible nodes before binding. Available CPU means allocatable capacity minus requests, not current usage. The GPU label constrains placement only; it does not allocate a GPU device.`,nodes:[{id:'pod',label:'Requested Pod',detail:`${value} CPU${flag?' + GPU constraint':''}`,type:'pod',state:'active'},{id:'a',label:'worker-a',detail:'2 CPU unreserved · no GPU',type:'node',state:result.node==='worker-a'?'ready':'idle'},{id:'b',label:'worker-b',detail:'1 CPU unreserved · GPU label',type:'node',state:result.node==='worker-b'?'ready':'idle'}],edges:result.node?[{from:'pod',to:result.node==='worker-b'?'b':'a',label:'fits request',state:'active'}]:[{from:'pod',to:'a',label:flag?'required label missing':'insufficient CPU',state:'blocked'},{from:'pod',to:'b',label:'insufficient CPU',state:'blocked'}]};
  controls=<><label>CPU request: {value}<input aria-label="CPU request" type="range" min="1" max="4" value={value} onChange={e=>setValue(+e.target.value)}/></label><label className="check-control"><input type="checkbox" checked={flag} onChange={e=>setFlag(e.target.checked)}/>Require a GPU-labelled node</label></>;
  code=`# Pod spec fragment; example nodes carry accelerator labels.
spec:
${flag?'  nodeSelector:\n    accelerator: gpu\n':''}  containers:
    - name: web
      image: nginx:1.28.0-alpine
      resources:
        requests:
          cpu: "${value}"
        limits:
          cpu: "4"
# The limit stays fixed; GPU allocation needs a device resource, not just a label.`;
 }else if(kind==='endpoints'){
  const chosen=flag?'api':'web';const ready=endpoints(chosen,[{id:'web-a',app:'web',ready:!second},{id:'web-b',app:'web',ready:true},{id:'api-a',app:'api',ready:true}]);
  frame={title:`${ready.length} eligible endpoint${ready.length===1?'':'s'}`,narration:`The selector app=${chosen} and readiness together produce ${ready.join(', ')}. A container can remain running while unready. This models a Service with publishNotReadyAddresses=false and no terminating endpoints; readiness alone does not describe every Service routing policy.`,nodes:[{id:'service',label:'Service',detail:`selector app=${chosen}`,type:'service',state:'active'},...['web-a','web-b','api-a'].map(id=>({id,label:id,detail:id==='web-a'&&second?'Running, not ready':`app=${id.startsWith('web')?'web':'api'}`,type:'pod' as const,state:ready.includes(id)?'ready' as const:'idle' as const}))],edges:ready.map(id=>({from:'service',to:id,label:'eligible',state:'active' as const}))};
  controls=<><label className="check-control"><input type="checkbox" checked={flag} onChange={e=>setFlag(e.target.checked)}/>Select app=api instead of app=web</label><label className="check-control"><input type="checkbox" checked={second} onChange={e=>setSecond(e.target.checked)}/>Make web-a unready</label></>;
  code=`spec:\n  selector:\n    app: ${chosen}\n# publishNotReadyAddresses defaults to false.
# Selected non-terminating ready endpoints: ${ready.join(', ')}`;
 }else if(kind==='storage'){
  const storageClass=flag?'archive':'fast';const result=bindVolume({size:value,storageClass},[{id:'volume-a',size:3,storageClass:'fast',bound:second}]);
  frame={title:result?'A matching volume can bind':'The claim remains Pending',narration:result?'Capacity, storage class, and availability match. Actual binding also considers access modes, topology, volume mode, and provisioning policy.':'No available matching volume satisfies this claim. A dynamic provisioner may create another volume; this example intentionally has only one static PV.',nodes:[{id:'claim',label:'PVC',detail:`${value} Gi · ${storageClass}`,type:'object',state:'active'},{id:'volume',label:'PV volume-a',detail:`3 Gi · fast · ${second?'bound':'available'}`,type:'storage',state:result?'ready':'warning'}],edges:[{from:'claim',to:'volume',label:result?'bind':'no match',state:result?'active':'blocked'}]};
  controls=<><label>Requested storage: {value} Gi<input aria-label="Requested storage Gi" type="range" min="1" max="5" value={value} onChange={e=>setValue(+e.target.value)}/></label><label className="check-control"><input type="checkbox" checked={flag} onChange={e=>setFlag(e.target.checked)}/>Request storage class archive</label><label className="check-control"><input type="checkbox" checked={second} onChange={e=>setSecond(e.target.checked)}/>Volume already bound to another claim</label></>;
  code=`spec:\n  storageClassName: ${storageClass}\n  resources:\n    requests:\n      storage: ${value}Gi`;
 }else if(kind==='authorization'){
  const result=authorize({authenticated:!flag,allowed:value===1,admitted:!second});
  frame={title:result,narration:result==='Accepted'?'Identity, permission, and admission checks all succeed for this request.':'The first failed boundary stops this request; later checks do not override it.',nodes:[{id:'identity',label:'Authentication',detail:flag?'No valid identity':'Identity established',type:'actor',state:flag?'failed':'ready'},{id:'rbac',label:'Authorization',detail:flag?'Not evaluated':value===1?'Verb permitted':'Verb forbidden',type:'control',state:flag?'idle':value===1?'ready':'failed'},{id:'admission',label:'Admission',detail:flag||value!==1?'Not evaluated':second?'Policy rejects object':'Object policy permits',type:'control',state:flag||value!==1?'idle':second?'failed':'ready'}],edges:[{from:'identity',to:'rbac',state:flag?'blocked':'active'},...(flag?[]:[{from:'rbac',to:'admission',state:value!==1?'blocked' as const:'active' as const}])]};
  controls=<><label className="check-control"><input type="checkbox" checked={flag} onChange={e=>setFlag(e.target.checked)}/>Invalid authentication</label><label className="check-control"><input type="checkbox" checked={value!==1} onChange={e=>setValue(e.target.checked?2:1)}/>No RBAC permission for this verb</label><label className="check-control"><input type="checkbox" checked={second} onChange={e=>setSecond(e.target.checked)}/>Object violates admission policy</label></>;
  code=`# Result: ${result}\n# Authentication establishes identity.\n# Authorization grants a specific verb on a resource.\n# Admission applies to applicable create/modify/delete/connect operations, not ordinary reads.
# Invalid credentials are modeled; anonymous access when enabled is a separate identity path.`;
 }else{
  const observed=flag?2:value;const result=operatorPlan(value,observed);
  frame={title:result.action==='observe'?'The replica target already agrees':`${result.action==='create'?'Raise':'Lower'} the Deployment target by ${result.delta}`,narration:result.action==='observe'?'Desired and observed replica targets agree. Repeating reconciliation preserves the same stable specification. The lab operator may still apply an unchanged object.':'The operator repairs Deployment.spec.replicas from the custom resource. The Deployment and ReplicaSet controllers manage the actual Pods; the operator does not directly create this many Pods.',nodes:[{id:'cr',label:'WebApp desired',detail:`Replicas: ${value}`,type:'object',state:'active'},{id:'controller',label:'Operator',detail:result.action==='observe'?'Target agrees':'Repair child specification',type:'control',state:result.action==='observe'?'ready':'active'},{id:'children',label:'Deployment target',detail:`spec.replicas: ${observed}`,type:'object',state:observed===value?'ready':'warning'}],edges:[{from:'cr',to:'controller',label:'intention',state:'active'},{from:'controller',to:'children',label:result.action==='observe'?'observe':'apply target',state:'active'}]};
  controls=<><label>Desired replicas: {value}<input aria-label="Operator desired replicas" type="range" min="1" max="5" value={value} onChange={e=>setValue(+e.target.value)}/></label><label className="check-control"><input type="checkbox" checked={flag} onChange={e=>setFlag(e.target.checked)}/>Introduce drift: observed replicas stay at 2</label></>;
  code=`apiVersion: labs.kv.example/v1alpha1\nkind: WebApp\nmetadata:\n  name: example\n  namespace: kv-lab\nspec:\n  replicas: ${value}\n  message: Hello from the control loop\n# Child Deployment.spec.replicas target: ${value}`;
 }
 return <details className="mechanism-experiment"><summary>Try the mechanism with your own inputs</summary><div className="experiment-controls">{controls}</div><Diagram frame={frame} kind={kind==='authorization'?'policy':kind==='operator'?'ownership':kind==='endpoints'?'flow':kind}/><div className="scene-narration" aria-live="polite"><strong>{frame.title}</strong><p>{frame.narration}</p></div><pre><code>{code}</code></pre></details>;
}
