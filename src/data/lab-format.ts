export type LabStep = { text: string; command?: string };

export type Exercise = {
  id: string;
  title: string;
  kind?: 'challenge';
  objective: string;
  requirements: string[];
  initial: string;
  expected: string[];
  setup: LabStep[];
  diagnose: LabStep[];
  solution: LabStep[];
  verify: LabStep[];
  cleanup: LabStep[];
  sources: { title: string; url: string }[];
};

export type Lab = {
  id: string;
  moduleId: string;
  files: readonly string[];
  exercises: Exercise[];
};

export const kubectl = 'kubectl --context kind-kv-lab -n kv-lab';
export const cluster = 'kubectl --context kind-kv-lab';
export function step(text: string, command?: string): LabStep {
  if (!command?.includes('\n')) return { text, command };
  // This block behaves the same when pasted into an interactive shell or run by the verifier.
  const body = command.split('\n').map(line => '  ' + line).join('\n');
  return { text, command: '(\n  set -euo pipefail\n' + body + '\n)' };
}
export const start = step('Check that the shell targets the disposable lab cluster and create its namespace if needed.', "bash -c 'source ./_common.sh'");
export const cleanup = [step('Remove the resources created by this exercise.', 'bash cleanup.sh')];
export const docs = (title: string, path: string) => ({ title, url: `https://kubernetes.io/docs/${path}/` });

export const labRequirements = [
  'Use the dedicated kind-kv-lab context and the kv-lab namespace. Keep using the terminal where you set up the cluster.',
  'Extract the lab bundle and change into the exercise directory. Keep its files together and run the snippets in Bash.',
];

export function shell(text: string, command: string): LabStep {
  return step(text, command.replaceAll('@k ', kubectl + ' ').replaceAll('@cluster ', cluster + ' '));
}

export function waitForHttp(client: string, url: string, expected: 'HTTP_OK' | 'HTTP_FAILED'): string {
  return [
    'result=',
    'for attempt in $(seq 1 30); do',
    '  result=$(@k exec ' + client + " -- sh -c 'if wget -qO- -T 2 " + url + " >/dev/null 2>&1; then echo HTTP_OK; else echo HTTP_FAILED; fi') || exit 1",
    '  [ "$result" = ' + expected + ' ] && break',
    '  sleep 1',
    'done',
    'printf "%s\\n" "$result"',
    'test "$result" = ' + expected,
  ].join('\n');
}
