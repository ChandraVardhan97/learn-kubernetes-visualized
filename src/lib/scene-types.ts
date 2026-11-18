export type SceneKind = 'cluster'|'flow'|'ownership'|'lifecycle'|'scheduling'|'storage'|'policy'|'chart'|'queue';
export type NodeState = 'idle'|'active'|'ready'|'warning'|'failed';
export interface SceneNode {id:string;label:string;detail?:string;type?:'control'|'node'|'pod'|'service'|'storage'|'actor'|'object';state?:NodeState;x?:number;y?:number;group?:string}
export interface SceneEdge {from:string;to:string;label?:string;state?:'idle'|'active'|'blocked'}
export interface Frame {title:string;narration:string;nodes:SceneNode[];edges?:SceneEdge[];metrics?:{label:string;value:number;max:number;unit?:string}[];code?:string}
export interface Scene {id:string;title:string;kind:SceneKind;description:string;assumption:string;frames:Frame[];variants?:{id:string;label:string;description:string;frames:Frame[]}[]}
export interface Concept {id:string;title:string;scene:string}
