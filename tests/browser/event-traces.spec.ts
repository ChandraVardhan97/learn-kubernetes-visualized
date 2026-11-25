import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const service = '/learn/foundations/m06-l01/';
const serviceId = 'm06-l01-dataplane';
const pod = '/learn/foundations/m02-l03/';
const podId = 'm02-l03-request';

test('curriculum traces expose each decision and open the right practice exercise', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const examples = [
    {
      lesson: '/learn/foundations/m05-l02/', scene: 'm05-l02-rollout', label: 'Inspect the rollout',
      event: 'count-replacement', title: 'Count the replacement as available',
      field: 'Available Pods (old / new)', before: '3 / 0', after: '3 / 1', practice: '/labs/#m05',
    },
    {
      lesson: '/learn/intermediate/m07-l02/', scene: 'm07-l02-affinity', label: 'Inspect the placement',
      event: 'filter-workers', title: 'Filter out an ineligible worker',
      field: 'Workers eligible for scoring', before: 'worker-a, worker-b, worker-c', after: 'worker-a, worker-c', practice: '/labs/#m07',
    },
    {
      lesson: '/learn/advanced/m14-l02/', scene: 'm14-l02-watch-cursor', label: 'Inspect the watch',
      event: 'history-expired', title: 'The cursor is too old',
      field: 'Watch response', before: 'Resume requested with cursor B', after: '410 Gone', practice: '/labs/#m15',
    },
    {
      lesson: '/learn/intermediate/m08-l02/', scene: 'm08-l02-directions', label: 'Inspect the policy decision',
      event: 'test-blocked-request', title: 'Test a new connection',
      field: 'HTTP probe from m08-client', before: 'HTTP_OK', after: 'HTTP_FAILED', practice: '/labs/#m08',
    },
    {
      lesson: '/learn/intermediate/m10-l01/', scene: 'm10-l01-claims', label: 'Inspect the storage handoff',
      event: 'reuse-bound-claim', title: 'Mount the existing claim',
      field: 'PVC used by ledger-1', before: 'data-ledger-1 mounted by the original Pod', after: 'data-ledger-1 mounted by the replacement',
      practice: '#practice-replace-one-member-and-inspect-continuity',
    },
    {
      lesson: '/learn/advanced/m16-l03/', scene: 'm16-l03-operator-repair-gc', label: 'Inspect the child repair',
      event: 'restore-owned-configmap', title: 'Recreate the owned ConfigMap',
      field: 'ConfigMap m16', before: 'Absent', after: 'New UID, original WebApp owner UID', practice: '/labs/#m16',
    },
  ];
  for (const example of examples) {
    await page.goto(example.lesson + '#scene-' + example.scene);
    const trace = page.locator('#trace-' + example.scene);
    await expect(trace.getByText(example.label, { exact: true })).toBeVisible();
    await trace.getByText(example.label, { exact: true }).click();
    const sequence = trace.getByRole('button', { name: 'Sequence', exact: true });
    await sequence.click();
    await expect(sequence).toHaveAttribute('aria-pressed', 'true');
    await trace.getByRole('link', { name: new RegExp(example.title) }).click();
    const evidence = trace.getByRole('region', { name: 'Event evidence' });
    await expect(evidence).toContainText(example.field);
    await expect(evidence.getByRole('definition')).toHaveText([example.before, example.after]);
    const url = new URL(page.url());
    expect(url.searchParams.get('event')).toBe(example.event);
    await page.reload();
    await expect(evidence.getByRole('heading', { name: example.title, exact: true })).toBeVisible();
    await expect(trace.locator('.trace-lab a')).toHaveAttribute('href', example.practice);
  }
});

test('the Service diagram and sequence inspect the same shareable event', async ({ page }) => {
  await page.goto(service + '#scene-' + serviceId);
  const trace = page.locator('#trace-' + serviceId);
  await trace.getByText('Inspect the request', { exact: true }).click();
  await expect(trace.getByRole('button', { name: 'Diagram', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const evidence = trace.getByRole('region', { name: 'Event evidence' });
  await expect(evidence).toContainText('Publish eligible endpoints');
  await trace.getByRole('button', { name: 'Sequence', exact: true }).click();
  const match = trace.getByRole('link', { name: /Rewrite the destination/ });
  await match.click();
  await expect(match).toHaveAttribute('aria-current', 'step');
  await expect(evidence).toContainText('10.96.0.42:8080');
  await expect(evidence).toContainText('10.244.1.7:80');
  const eventUrl = page.url();
  expect(eventUrl).toContain('event=rewrite-destination');
  await trace.getByRole('button', { name: 'Diagram', exact: true }).click();
  await expect(evidence).toContainText('Rewrite the destination');
  await page.goBack();
  await expect(evidence).toContainText('Publish eligible endpoints');
  await page.goto(eventUrl);
  await expect(evidence).toBeVisible();
  await expect(evidence).toContainText('Rewrite the destination');
  const timeline = trace.getByRole('slider', { name: 'Demonstration timeline' });
  const start = Number(await timeline.inputValue());
  await trace.getByRole('button', { name: 'Play trace', exact: true }).click();
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(start + 100);
  await trace.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(trace.getByRole('button', { name: 'Play trace', exact: true })).toBeVisible();
  expect(page.url()).toBe(eventUrl);
  await trace.getByText('Reveal prediction answer', { exact: true }).click();
  await expect(trace.getByText('DNS can still return the Service IP.', { exact: false })).toBeVisible();
  await trace.getByRole('link', { name: 'Verify this in the Service lab' }).click();
  await expect(page.getByRole('heading', { name: 'Restore HTTP to a Service with no backends' })).toBeVisible();
});

test('the Pod trace distinguishes API acceptance, binding, and readiness', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pod + '?scene=' + podId + '&event=bind-pod#trace-' + podId);
  const trace = page.locator('#trace-' + podId);
  const evidence = trace.getByRole('region', { name: 'Event evidence' });
  await expect(evidence).toContainText('spec.nodeName');
  await expect(evidence).toContainText('worker-a');
  const timeline = trace.getByRole('slider', { name: 'Demonstration timeline' });
  await timeline.press('Home');
  await expect(evidence).toContainText('Submit the Pod');
  await timeline.press('ArrowRight');
  await expect(evidence).toContainText('Store the Pod');
  await trace.getByRole('button', { name: 'Play trace', exact: true }).click();
  await expect(evidence).toContainText('Report Ready');
  await expect(trace.locator('.trace-pulse')).toHaveCount(0);
  await trace.getByRole('button', { name: 'Sequence', exact: true }).click();
  const endPosition = await timeline.inputValue();
  const currentUrl = page.url();
  const copy = evidence.getByRole('button', { name: 'Copy event link', exact: true });
  await expect(copy).toBeVisible();
  await copy.press('Enter');
  await expect(evidence.getByRole('status')).toHaveText('Link copied');
  const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedUrl).toBe(new URL('?scene=' + podId + '&event=report-ready#trace-' + podId, currentUrl).href);
  await expect(timeline).toHaveValue(endPosition);
  expect(page.url()).toBe(currentUrl);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const accessibility = await new AxeBuilder({ page }).include('#trace-' + podId)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => violation.id)).toEqual([]);
  await page.goto(copiedUrl);
  await expect(evidence.getByRole('heading', { name: 'Report Ready', exact: true })).toBeVisible();
});

test('site shortcuts have focus-safe help and GitHub links reach their destinations', async ({ page }) => {
  await page.goto('/');
  const source = page.getByRole('link', { name: 'View repository on GitHub' });
  await expect(source).toHaveAttribute('href', 'https://github.com/ChandraVardhan97/learn-kubernetes-visualized');
  const guide = page.getByRole('button', { name: 'Keyboard shortcuts', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await guide.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Focused visual timeline');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(guide).toBeFocused();
  await page.keyboard.press('?');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  const search = page.getByRole('textbox', { name: 'Search', exact: true });
  await search.fill('what');
  await search.press('?');
  await expect(search).toHaveValue('what?');
  await expect(dialog).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Contribute on GitHub' })).toHaveAttribute('href', /\/blob\/main\/CONTRIBUTING\.md$/);
  await expect(page.getByRole('link', { name: 'Chandu B', exact: true })).toHaveAttribute('href', 'https://www.linkedin.com/in/chandubodduluri/');
});
