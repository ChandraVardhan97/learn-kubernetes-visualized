import { describe, expect, it } from 'vitest';
import { endpointState, registrationState, scaleState, timing } from '../src/lib/pilot-scenes';

describe('pilot scene timelines', () => {
  it('keeps the desired count, ReplicaSet target, created Pods, and ready Pods independent', () => {
    expect(scaleState(0)).toMatchObject({ desired: 2, target: 2, created: 2, ready: 2 });
    expect(scaleState(timing.scale.desired)).toMatchObject({ desired: 3, target: 2, created: 2, ready: 2 });
    expect(scaleState(timing.scale.target)).toMatchObject({ desired: 3, target: 3, created: 2, ready: 2 });
    expect(scaleState(timing.scale.created)).toMatchObject({ created: 3, ready: 2 });
    expect(scaleState(timing.scale.ready)).toMatchObject({ created: 3, ready: 3 });
  });

  it('only shows an HTTP response after the ready Pod received the request and replied', () => {
    expect(endpointState(0)).toBe('idle');
    expect(endpointState(timing.service.forward)).toBe('forwarding');
    expect(endpointState(timing.service.received)).toBe('received');
    expect(endpointState(timing.service.reply)).toBe('replying');
    expect(endpointState(timing.service.complete)).toBe('complete');
  });

  it('leaves the stored WebApp without children until the demo reconciler runs', () => {
    expect(registrationState(0)).toMatchObject({ registered: false, stored: false, running: false, children: 0 });
    expect(registrationState(timing.crd.registered)).toMatchObject({ registered: true, stored: false, running: false, children: 0 });
    expect(registrationState(timing.crd.stored)).toMatchObject({ registered: true, stored: true, running: false, children: 0 });
    expect(registrationState(timing.crd.running)).toMatchObject({ stored: true, running: true, children: 0 });
    expect(registrationState(timing.crd.configMap)).toMatchObject({ stored: true, running: true, children: 1 });
    expect(registrationState(timing.crd.deployment)).toMatchObject({ stored: true, running: true, children: 2 });
  });
});
