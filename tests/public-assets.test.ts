import {afterEach,describe,expect,it} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {unsafePublicAssets,unexpectedLabAssets} from '../scripts/lib/public-assets';
const roots:string[]=[];
function fixture(){const root=mkdtempSync(join(tmpdir(),'kv-public-'));roots.push(root);return root;}
afterEach(()=>roots.splice(0).forEach(root=>rmSync(root,{recursive:true,force:true})));
describe('public release excludes lab recovery data',()=>{
 it('rejects backups and recovery credentials nested beneath normal public content',()=>{
  const root=fixture();const backup=join(root,'labs/m18/backup');mkdirSync(backup,{recursive:true});
  writeFileSync(join(backup,'etcd.db'),'synthetic fixture');writeFileSync(join(backup,'recovery.kubeconfig'),'synthetic fixture');
  expect(unsafePublicAssets(root)).toEqual(expect.arrayContaining(['labs/m18/backup']));
 });
 it('rejects standalone database and private key artifacts',()=>{
  const root=fixture();writeFileSync(join(root,'etcd.db'),'synthetic fixture');writeFileSync(join(root,'server.key'),'synthetic fixture');
  expect(unsafePublicAssets(root)).toEqual(expect.arrayContaining(['etcd.db','server.key']));
 });
 it('allows intentional Kubernetes examples and the reviewed exercise archive',()=>{
  const root=fixture();writeFileSync(join(root,'resources.yaml'),'kind: Secret\nstringData: {demo: example-only}');writeFileSync(join(root,'kv-labs.zip'),'fixture');
  expect(unsafePublicAssets(root)).toEqual([]);
 });
 it('rejects unlisted files even if their names look harmless',()=>{
  const root=fixture();mkdirSync(join(root,'labs/m18'),{recursive:true});
  writeFileSync(join(root,'labs/m18/run.sh'),'fixture');writeFileSync(join(root,'labs/m18/local-notes.txt'),'fixture');
  expect(unexpectedLabAssets(root,new Set(['m18/run.sh']))).toEqual(['labs/m18/local-notes.txt']);
 });
});
