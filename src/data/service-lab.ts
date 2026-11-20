import { cleanup, docs, kubectl as k, step, type Exercise } from './lab-format';

export const serviceLab: Exercise = {
  id: 'm06',
  title: 'Restore HTTP to a Service with no backends',
  kind: 'challenge',
  objective: 'Trace an HTTP failure from a client Pod to a Service selector and repair routing without changing the healthy web Deployment.',
  requirements: ['Run the commands from the m06 directory. The default kind DNS and Service dataplane are sufficient.'],
  initial: 'The starter creates Deployment m06, Service m06, and Pod m06-client. It first confirms HTTP works, then changes the selector to app=no-match. The web Pods stay Ready and DNS still resolves.',
  expected: ['Service m06 selects Pods labeled app=m06 and has at least one ready backend.', 'A new HTTP request from m06-client receives the nginx page. The Deployment and client stay in place.'],
  setup: [step('Create the fixture and stop with DNS working and HTTP deliberately broken.', 'bash start.sh')],
  diagnose: [
    step('Confirm the web Pods are ready and record their app label.', `${k} get deployment m06\n${k} get pods -l app=m06 --show-labels`),
    step('Compare the Service selector with the Pod labels. The EndpointSlice should have no ready backend.', `${k} get service m06 -o jsonpath='{.spec.selector}{"\\n"}'\n${k} get endpointslices -l kubernetes.io/service-name=m06 -o yaml`),
    step('Resolve the Service name from the same client, then probe a new HTTP connection. Expect the DNS lookup and the command itself to succeed, with the HTTP probe reporting HTTP_FAILED.', `${k} exec m06-client -- nslookup m06.kv-lab.svc.cluster.local\n${k} exec m06-client -- sh -c 'if wget -qO- -T 2 http://m06 >/dev/null; then echo HTTP_OK; else echo HTTP_FAILED; fi'`),
  ],
  solution: [
    step('DNS resolves the Service name to its stable address. The selector determines which Pod addresses can serve traffic. Change the selector to match the existing web Pods.', `${k} patch service m06 --type merge -p '{"spec":{"selector":{"app":"m06"}}}'`),
    step('Use Verify in the Run, inspect & clean up section. EndpointSlice and dataplane updates can take a moment to converge.'),
  ],
  verify: [step('Wait for a ready backend and a successful request from m06-client.', 'bash verify.sh')],
  cleanup,
  sources: [docs('Debug Services', 'tasks/debug/debug-application/debug-service'), docs('EndpointSlices', 'concepts/services-networking/endpoint-slices')],
};
