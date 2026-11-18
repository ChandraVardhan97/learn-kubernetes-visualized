export interface Pod {id:string;ready:boolean}
export function reconcile(desired:number,pods:Pod[],serial:number) {
 const kept=pods.slice(0,Math.max(0,desired));
 const created=Array.from({length:Math.max(0,desired-kept.length)},(_,i)=>`pod-${serial+i}`);
 return {owner:'ReplicaSet' as const,created,pods:[...kept,...created.map(id=>({id,ready:false}))]};
}
export function schedule(pod:{request:number;limit:number;requiresGPU:boolean},nodes:{id:string;available:number;gpu:boolean}[]) {
 const candidates=nodes.filter(n=>n.available>=pod.request&&(!pod.requiresGPU||n.gpu));
 return {node:candidates[0]?.id??null,reason:candidates.length?'Fits requested resources and constraints':'Pending: no node satisfies the request and constraints'};
}
export const endpoints=(selector:string,pods:{id:string;app:string;ready:boolean}[])=>pods.filter(p=>p.app===selector&&p.ready).map(p=>p.id);
export function authorize(request:{authenticated:boolean;allowed:boolean;admitted:boolean}) {
 return !request.authenticated?'Unauthenticated':!request.allowed?'Forbidden':!request.admitted?'Rejected by admission':'Accepted';
}
export const bindVolume=(claim:{size:number;storageClass:string},volumes:{id:string;size:number;storageClass:string;bound:boolean}[])=>volumes.find(v=>!v.bound&&v.storageClass===claim.storageClass&&v.size>=claim.size)?.id??null;
export function operatorPlan(desired:number,observed:number) {
 return {action:desired===observed?'observe':desired>observed?'create':'delete',delta:Math.abs(desired-observed)};
}
