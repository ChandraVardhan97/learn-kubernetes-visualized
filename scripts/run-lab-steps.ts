import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { join, resolve } from 'node:path';
import { labs } from '../src/data/labs';
import type { Exercise, LabStep } from '../src/data/lab-format';

const mode = process.argv[2] ?? 'smoke';
const root = process.env.KV_TEST_BUNDLE;
const scratch = process.env.KV_TEST_ROOT;
assert(root && scratch && resolve(process.env.KUBECONFIG ?? '') === resolve(scratch, 'lab.kubeconfig'), 'Use scripts/run-labs.sh with an isolated cluster');
const smoke = new Set(['m02', 'm05', 'm06', 'm07', 'm09', 'm11', 'm16', 'm20']);
const catalog = labs.flatMap(lab => lab.exercises.map(exercise => ({ lab, exercise })));
const exact = catalog.some(({ exercise }) => exercise.id === mode);
const selected = catalog.filter(({ lab, exercise }) => mode === 'all' || (mode === 'smoke' && smoke.has(lab.id)) ||
  (exact ? mode === exercise.id : mode === lab.id) || (mode === 'm18-offline-restore' && exercise.id === 'm18'));
assert(selected.length, 'Unknown exercise: ' + mode);
const kubectlArgs = ['--context', 'kind-kv-lab'];

function output(args: string[]): string {
  const result = spawnSync('kubectl', [...kubectlArgs, ...args], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 0, 'kubectl ' + args.join(' ') + ': ' + (result.error?.message ?? result.stderr));
  return result.stdout.trim();
}

function nodeFixture(): string {
  const { metadata, spec } = JSON.parse(output(['get', 'node', 'kv-lab-worker', '-o', 'json']));
  return JSON.stringify({ marker: metadata.annotations?.['labs.kv.example/p02'], taints: spec.taints ?? [] });
}

function runSteps(steps: LabStep[], cwd: string, env: NodeJS.ProcessEnv): void {
  for (const step of steps) {
    console.log(step.text);
    if (!step.command) continue;
    const result = spawnSync('bash', ['-c', step.command], { cwd, env, stdio: 'inherit', timeout: 360_000 });
    assert.equal(result.status, 0, result.error?.message ?? ('Command exited ' + result.status + ': ' + step.command));
  }
}

function verifyCleanup(id: string, exercise: Exercise, before: string): void {
  const resources = 'deployment,replicaset,pod,service,configmap,secret,pvc,statefulset,daemonset,job,cronjob,role,rolebinding,serviceaccount,networkpolicy,resourcequota,limitrange,hpa,pdb,lease,endpointslice';
  function remaining(): string[] {
    const labeled = output(['-n', 'kv-lab', 'get', resources, '-l', 'lab=' + id, '-o', 'name']);
    const volumes = JSON.parse(output(['get', 'pv', '-o', 'json'])).items as { spec: { claimRef?: { namespace: string } }; metadata: { name: string } }[];
    const claims = volumes.filter(volume => volume.spec.claimRef?.namespace === 'kv-lab').map(volume => volume.metadata.name);
    const custom = output(['get', 'crd', 'webapps.labs.kv.example', '--ignore-not-found', '-o', 'name'])
      ? output(['-n', 'kv-lab', 'get', 'webapps', '-o', 'name']) : '';
    return [labeled, custom, ...claims].filter(Boolean);
  }
  let leftovers = remaining();
  for (let attempt = 0; leftovers.length && attempt < 40; attempt++) {
    spawnSync('sleep', ['1']);
    leftovers = remaining();
  }
  assert.deepEqual(leftovers, [], 'Resources remaining after cleanup');
  if (exercise.id === 'm18') {
    const result = spawnSync('docker', ['exec', 'kv-lab-control-plane', 'sh', '-c',
      'test ! -e /var/lib/etcd/kv-lab.db && test ! -e /var/lib/etcd/kv-lab.db.part']);
    assert.equal(result.status, 0, 'Source etcd snapshot staging files remain');
  }
  if (id === 'p02') assert.equal(nodeFixture(), before, 'Worker taints or ownership marker changed');
  if (id === 'p04') assert.equal(output(['get', 'namespace', 'kv-lab-p04-target', '--ignore-not-found', '-o', 'name']), '');
  if (exercise.id === 'm18-offline-restore') {
    const result = spawnSync('kind', ['get', 'clusters'], { encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert(!result.stdout.split(/\s+/).includes('kv-recovery'), 'Recovery cluster still exists');
  }
}

const failures: string[] = [];
for (const { lab, exercise } of selected) {
  console.log('\n=== ' + exercise.id + ' ===');
  const cwd = join(root, lab.id);
  const env: NodeJS.ProcessEnv = { ...process.env, KV_LAB_BACKUP_DIR: join(scratch, 'backups', lab.id) };
  const before = lab.id === 'p02' ? nodeFixture() : '';
  try {
    for (const phase of ['setup', 'diagnose', 'solution', 'verify'] as const) {
      console.log('--- ' + phase + ' ---');
      runSteps(exercise[phase], cwd, env);
    }
    if (exercise.id === 'm18-offline-restore') {
      const unowned: NodeJS.ProcessEnv = { ...env, KV_LAB_BACKUP_DIR: join(scratch, 'backups', 'recovery-guard-check') };
      const result: SpawnSyncReturns<string> = spawnSync('bash', ['cleanup-recovery.sh'], { cwd, env: unowned, encoding: 'utf8' });
      assert.equal(result.status, 2, 'Recovery cleanup must refuse without an ownership record');
      assert.match(result.stderr, /Refusing to remove a recovery cluster/);
      console.log('PASS recovery cleanup refuses an unowned cluster');
    }
    console.log('PASS ' + exercise.id + ' documented steps');
  } catch (error) {
    failures.push(exercise.id);
    console.error('FAIL ' + exercise.id, error);
  } finally {
    runSteps(exercise.cleanup, cwd, env);
    verifyCleanup(lab.id, exercise, before);
    console.log('PASS ' + exercise.id + ' cleanup');
  }
}

if (mode === 'all') {
  output(['create', 'configmap', 'm14', '-n', 'kv-lab', '--from-literal=mode=interrupted']);
  output(['label', 'configmap', 'm14', '-n', 'kv-lab', 'lab=m14']);
  output(['patch', 'configmap', 'm14', '-n', 'kv-lab', '--type', 'merge', '-p', '{"metadata":{"finalizers":["labs.kv.example/hold","labs.kv.example/test-only"]}}']);
  output(['delete', 'configmap', 'm14', '-n', 'kv-lab', '--wait=false']);
  const lab = labs.find(entry => entry.id === 'm14')!;
  const cwd = join(root, lab.id);
  runSteps([{ text: 'Release the interrupted teaching hold.', command: 'bash release-hold.sh' }], cwd, process.env);
  assert.equal(output(['get', 'configmap', 'm14', '-n', 'kv-lab', '-o', 'jsonpath={.metadata.finalizers[0]}']), 'labs.kv.example/test-only');
  output(['patch', 'configmap', 'm14', '-n', 'kv-lab', '--type', 'merge', '-p', '{"metadata":{"finalizers":[]}}']);
  output(['wait', '--for=delete', 'configmap/m14', '-n', 'kv-lab', '--timeout=25s']);
  output(['create', 'configmap', 'm14', '-n', 'kv-lab', '--from-literal=mode=interrupted']);
  output(['label', 'configmap', 'm14', '-n', 'kv-lab', 'lab=m14']);
  output(['patch', 'configmap', 'm14', '-n', 'kv-lab', '--type', 'merge', '-p', '{"metadata":{"finalizers":["labs.kv.example/hold"]}}']);
  output(['delete', 'configmap', 'm14', '-n', 'kv-lab', '--wait=false']);
  runSteps(lab.exercises[0].cleanup, cwd, process.env);
  verifyCleanup(lab.id, lab.exercises[0], '');
  console.log('PASS interrupted m14 finalizer cleanup');
}
assert.deepEqual(failures, [], 'Exercises with failed published steps');
console.log('PASS ' + selected.length + ' procedures in ' + mode + ' mode');
