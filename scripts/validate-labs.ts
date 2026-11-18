import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseAllDocuments } from 'yaml';
import { labs } from '../src/data/labs';
import { modules } from '../src/data/modules';

const root = process.cwd();
assert.deepEqual(labs.map(l => l.id), modules.map(m => m.id), 'Each module needs one ordered lab');
let manifests = 0;
let downloads = 0;
const schemaPaths:string[] = [];
for (const lab of labs) {
  for (const field of ['goal','requirements','expected','commands','diagnostics','cleanup','notes'] as const) {
    assert(lab[field].trim().length > 0, `${lab.id}: empty ${field}`);
  }
  for (const name of ['README.md','run.sh','cleanup.sh','_common.sh']) {
    assert(lab.files.some(f => f.name === name), `${lab.id}: missing ${name}`);
  }
  const names = new Set<string>();
  for (const file of lab.files) {
    assert(!names.has(file.name), `${lab.id}: duplicate download ${file.name}`);
    names.add(file.name);
    assert(!file.name.includes('..') && !file.name.includes('/'), 'Downloads must be flat safe names');
    const target = join(root,'public/labs',lab.id,file.name);
    assert.equal(readFileSync(target,'utf8'), file.content, `${lab.id}/${file.name}: canonical/download drift`);
    downloads++;
    if (file.name.endsWith('.sh')) {
      const result = spawnSync('bash',['-n',target],{encoding:'utf8'});
      assert.equal(result.status,0,`${target}: ${result.stderr}`);
    }
    if (file.name.endsWith('.py')) {
      const result = spawnSync('python3',['-c','import sys; compile(open(sys.argv[1]).read(), sys.argv[1], "exec")',target],{encoding:'utf8'});
      assert.equal(result.status,0,`${target}: ${result.stderr}`);
    }
    if (!file.name.endsWith('.yaml')) continue;
    const docs = parseAllDocuments(file.content);
    for (const doc of docs) {
      assert.equal(doc.errors.length,0,`${target}: ${doc.errors.join(', ')}`);
      const resource = doc.toJS();
      if (resource === null) continue;
      assert(resource.apiVersion && resource.kind, `${target}: missing resource type`);
      if (resource.kind === 'Cluster' || resource.kind === 'Kustomization') continue;
      assert(resource.metadata?.name, `${target}: missing metadata.name`);
      if (resource.kind !== 'CustomResourceDefinition') {
        assert.equal(resource.metadata.namespace,'kv-lab',`${target}: namespace must be explicit`);
      }
      if (process.argv.includes('--server')) {
        const result = spawnSync('kubectl',['--context','kind-kv-lab','--namespace','kv-lab','apply','--dry-run=server','--validate=strict','-f','-'],{input:JSON.stringify(resource),encoding:'utf8'});
        assert.equal(result.status,0,`${target}: server validation failed: ${result.stderr}`);
      }
      manifests++;
      if (resource.apiVersion !== 'labs.kv.example/v1alpha1') schemaPaths.push(target);
    }
  }
  const guard = lab.files.find(f => f.name === '_common.sh')!.content;
  assert(guard.includes('CONTEXT=kind-kv-lab') && guard.includes('NAMESPACE=kv-lab'));
  assert(guard.includes('kind get nodes --name kv-lab'),`${lab.id}: missing cluster identity guard`);
}
assert.equal(parseAllDocuments(readFileSync(join(root,'public/labs/kind.yaml'),'utf8'))[0].errors.length,0);
const probe = spawnSync('kubeconform',['-v'],{encoding:'utf8'});
if (!probe.error && probe.status === 0) {
  const result = spawnSync('kubeconform',['-strict','-summary','-kubernetes-version','1.37.0',...new Set(schemaPaths)],{encoding:'utf8'});
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  assert.equal(result.status,0,'kubeconform schema validation failed');
} else {
  console.log('kubeconform unavailable: syntax, resource invariants and script parsing checked; use server dry-run for schema validation.');
}
assert(existsSync(join(root,'scripts/run-labs.sh')));
console.log(`Validated ${labs.length} module labs, ${downloads} identical downloads, ${manifests} Kubernetes documents and shell/Python syntax.`);
