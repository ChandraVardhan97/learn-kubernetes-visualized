import { describe, expect, it } from 'vitest';
import { reconcile, schedule, endpoints, authorize, bindVolume, operatorPlan } from '../src/lib/simulations';
import { importProgress, emptyProgress } from '../src/lib/progress';

describe('Kubernetes teaching invariants', () => {
 it('replaces a deleted Pod with a new identity owned by its ReplicaSet', () => {
   const first = reconcile(3, [{id:'pod-a',ready:true},{id:'pod-b',ready:true}], 7);
   expect(first.pods).toHaveLength(3);
   expect(first.created).toEqual(['pod-7']);
   expect(first.owner).toBe('ReplicaSet');
 });
 it('does not equate readiness with container restart', () => {
   const result = reconcile(1, [{id:'pod-a',ready:false}], 2);
   expect(result.created).toEqual([]);
   expect(result.pods[0]).toEqual({id:'pod-a',ready:false});
 });
 it('keeps a Pod pending when its request cannot fit, regardless of limit', () => {
   expect(schedule({request:3,limit:4,requiresGPU:false},[{id:'a',available:2,gpu:false}]).node).toBeNull();
   expect(schedule({request:1,limit:4,requiresGPU:true},[{id:'a',available:2,gpu:false}]).node).toBeNull();
 });
 it('routes only to selected ready Pods', () => {
   expect(endpoints('web',[{id:'a',app:'web',ready:true},{id:'b',app:'web',ready:false},{id:'c',app:'api',ready:true}])).toEqual(['a']);
 });
 it('keeps authentication, authorization and admission separate', () => {
   expect(authorize({authenticated:false,allowed:true,admitted:true})).toBe('Unauthenticated');
   expect(authorize({authenticated:true,allowed:false,admitted:true})).toBe('Forbidden');
   expect(authorize({authenticated:true,allowed:true,admitted:false})).toBe('Rejected by admission');
 });
 it('requires matching class, sufficient capacity and an available volume', () => {
   const claim = {size:5,storageClass:'fast'};
   expect(bindVolume(claim,[{id:'p',size:10,storageClass:'slow',bound:false}])).toBeNull();
   expect(bindVolume(claim,[{id:'p',size:4,storageClass:'fast',bound:false}])).toBeNull();
   expect(bindVolume(claim,[{id:'p',size:10,storageClass:'fast',bound:true}])).toBeNull();
   expect(bindVolume(claim,[{id:'p',size:10,storageClass:'fast',bound:false}])).toBe('p');
 });
 it('makes repeated reconciliation idempotent', () => {
   expect(operatorPlan(3,3)).toEqual({action:'observe',delta:0});
   expect(operatorPlan(4,2)).toEqual({action:'create',delta:2});
 });
});

describe('progress imports protect existing learning history', () => {
 it('rejects malformed, unsupported, and structurally invalid imports without mutation', () => {
   const existing={...emptyProgress(),completed:['m01-l01']};
   for (const bad of ['{bad','{"version":2}','{"version":1,"completed":"all","bookmarks":[]}']) {
     expect(() => importProgress(bad,existing,['m01-l01'])).toThrow();
     expect(existing.completed).toEqual(['m01-l01']);
   }
 });
 it('merges known IDs and discards unknown IDs', () => {
   const text=JSON.stringify({...emptyProgress(),completed:['m01-l02','unknown'],bookmarks:['m01-l01']});
   expect(importProgress(text,{...emptyProgress(),completed:['m01-l01']},['m01-l01','m01-l02']).completed).toEqual(['m01-l01','m01-l02']);
 });
});
