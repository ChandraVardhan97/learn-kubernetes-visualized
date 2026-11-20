import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseAllDocuments } from 'yaml';
import { labDownloadPaths, labs, moduleLabs } from '../src/data/labs';
import { modules } from '../src/data/modules';
import { labReadme } from '../src/lib/lab-readme';

const root = 'public/labs';
assert.deepEqual(moduleLabs.map(lab => lab.id), modules.map(module => module.id), 'Each module needs one ordered lab');
assert.equal(new Set(labDownloadPaths).size, labDownloadPaths.length, 'Duplicate download paths');
const exerciseIds = new Set<string>();
const diagnosticSignatures = new Set<string>();
let manifests = 0;
const schemaPaths = new Set<string>();

function run(command: string, args: string[], label: string, input?: string) {
  const result = spawnSync(command, args, { input, encoding: 'utf8' });
  assert.equal(result.status, 0, label + ': ' + (result.error?.message ?? result.stderr));
}

for (const lab of labs) {
  assert(modules.some(module => module.id === lab.moduleId), lab.id + ': unknown module');
  assert.equal(readFileSync(join(root, lab.id, 'README.md'), 'utf8'), labReadme(lab), lab.id + ': generated README is stale');
  assert(lab.files.includes('_common.sh') && lab.files.includes('cleanup.sh'), lab.id + ': missing scoped helpers');
  const guard = readFileSync(join(root, lab.id, '_common.sh'), 'utf8');
  assert(guard.includes('CONTEXT=kind-kv-lab') && guard.includes('NAMESPACE=kv-lab') && guard.includes('kind get nodes --name kv-lab'));
  for (const exercise of lab.exercises) {
    assert(!exerciseIds.has(exercise.id), 'Duplicate exercise ' + exercise.id);
    assert(exercise.id === lab.id || exercise.id.startsWith(lab.id + '-'), 'Exercise IDs must belong to their lab');
    exerciseIds.add(exercise.id);
    assert(exercise.objective.trim() && exercise.initial.trim() && exercise.requirements.length && exercise.expected.length && exercise.sources.length, exercise.id + ': incomplete brief');
    for (const phase of ['setup', 'diagnose', 'solution', 'verify', 'cleanup'] as const) {
      const steps = exercise[phase];
      assert(steps.length && steps.every(step => step.text.trim()), exercise.id + ': incomplete ' + phase);
      if (phase !== 'solution') assert(steps.some(step => step.command), exercise.id + ': missing ' + phase + ' commands');
      for (const step of steps) {
        if (step.command) run('bash', ['-n'], exercise.id + ' ' + phase, step.command);
      }
    }
    const signature = exercise.diagnose.map(step => step.command ?? '').join('\n').replace(/\b[mp]\d{2}\b/g, 'ID');
    assert(!diagnosticSignatures.has(signature), exercise.id + ': duplicated diagnostics');
    diagnosticSignatures.add(signature);
  }
  for (const name of lab.files) {
    assert(/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(name) && !name.includes('..'), 'Unsafe download name: ' + name);
    const path = join(root, lab.id, name);
    const content = readFileSync(path, 'utf8');
    if (name.endsWith('.sh')) run('bash', ['-n', path], path);
    if (name.endsWith('.py')) run('python3', ['-c', 'import sys; compile(open(sys.argv[1]).read(), sys.argv[1], "exec")', path], path);
    if (!name.endsWith('.yaml')) continue;
    for (const doc of parseAllDocuments(content)) {
      assert.equal(doc.errors.length, 0, path + ': ' + doc.errors.join(', '));
      const resource = doc.toJS();
      if (resource === null) continue;
      assert(resource.apiVersion && resource.kind, path + ': missing resource type');
      if (resource.kind === 'Cluster' || resource.kind === 'Kustomization') continue;
      assert(resource.metadata?.name, path + ': missing resource name');
      if (resource.kind !== 'CustomResourceDefinition') assert.equal(resource.metadata.namespace, 'kv-lab', path + ': namespace must be explicit');
      if (process.argv.includes('--server')) {
        run('kubectl', ['--context', 'kind-kv-lab', '-n', 'kv-lab', 'apply', '--dry-run=server', '--validate=strict', '-f', '-'], path + ' server dry-run', JSON.stringify(resource));
      }
      manifests++;
      if (resource.apiVersion !== 'labs.kv.example/v1alpha1') schemaPaths.add(path);
    }
  }
}
assert.equal(parseAllDocuments(readFileSync(join(root, 'kind.yaml'), 'utf8'))[0].errors.length, 0);

const zipCheck = [
  'from pathlib import Path',
  'from zipfile import ZipFile',
  'import json, sys',
  'root = Path(sys.argv[1])',
  'expected = sorted(json.load(sys.stdin))',
  'with ZipFile(root / "kv-labs.zip") as archive:',
  '    assert sorted(archive.namelist()) == expected, "Unexpected, duplicate, or missing ZIP paths"',
  '    for name in expected:',
  '        assert archive.read(name) == (root / name).read_bytes(), "ZIP differs from download: " + name',
].join('\n');
run('python3', ['-c', zipCheck, root], 'Lab archive', JSON.stringify(labDownloadPaths));

const probe = spawnSync('kubeconform', ['-v'], { encoding: 'utf8' });
if (!probe.error && probe.status === 0) {
  run('kubeconform', ['-strict', '-summary', '-kubernetes-version', '1.37.0', ...schemaPaths], 'kubeconform');
} else if (!process.argv.includes('--server')) {
  console.log('kubeconform unavailable. Use server dry-run for API schema validation.');
}
console.log('Validated ' + moduleLabs.length + ' module labs, ' + exerciseIds.size + ' procedures, ' + labDownloadPaths.length + ' ZIP files and ' + manifests + ' Kubernetes documents.');
