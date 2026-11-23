import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('scale playback keeps Pod slots in place and can pause, resume, and replay', async ({ page }) => {
  await page.goto('/learn/foundations/m05-l01/#scene-m05-l01-scale');
  const scene = page.locator('#scene-m05-l01-scale');
  const timeline = scene.getByRole('slider', { name: 'Demonstration timeline' });
  const counts = scene.getByRole('term');
  await expect(counts).toHaveText(['Desired', 'Pods created', 'Ready']);
  await expect(scene.getByRole('definition')).toHaveText(['2', '2', '2']);

  await scene.getByRole('button', { name: 'Scale from 2 to 3' }).click();
  await expect(scene.getByRole('definition')).toHaveText(['3', '2', '2']);
  await scene.getByRole('button', { name: 'Pause' }).click();
  const stopped = await timeline.inputValue();
  await expect.poll(async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return timeline.inputValue();
  }).toBe(stopped);
  await scene.getByRole('button', { name: 'Scale from 2 to 3' }).click();
  await expect(scene.getByRole('definition')).toHaveText(['3', '3', '3'], { timeout: 10000 });
  await expect(scene.getByRole('button', { name: 'Replay' })).toBeVisible();
  await timeline.press('Home');
  await expect(scene.getByRole('definition')).toHaveText(['2', '2', '2']);
  await timeline.press('ArrowRight');
  await expect(timeline).toHaveAttribute('aria-valuetext', 'Deployment requests 3');
});

test('reduced motion preserves Service and WebApp results without playing motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 870 });
  await page.goto('/learn/foundations/m06-l01/#scene-m06-l01-dataplane');
  const service = page.locator('#scene-m06-l01-dataplane');
  await expect(service.getByText('10.96.0.42:8080', { exact: true })).toBeVisible();
  await expect(service.getByText('Not ready · skipped', { exact: true })).toBeVisible();
  await service.getByRole('button', { name: 'Send a request' }).press('Enter');
  await expect(service.getByText('HTTP 200 received', { exact: true })).toBeVisible();
  await expect(service.locator('.pilot-token')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.goto('/learn/advanced/m16-l01/#scene-m16-l01-crd-registration');
  const crd = page.locator('#scene-m16-l01-crd-registration');
  await crd.getByRole('button', { name: 'Register the WebApp API' }).click();
  await expect(crd.getByText('The API can now serve WebApps', { exact: true }).first()).toBeVisible();
  await crd.getByRole('button', { name: 'Apply the WebApp' }).click();
  await expect(crd.getByText('WebApp/m16', { exact: true })).toBeVisible();
  await expect(crd.getByRole('list', { name: 'Generated resources: 0' })).toBeVisible();
  await crd.getByRole('button', { name: 'Start the demo reconciler' }).click();
  await expect(crd.getByRole('list', { name: 'Generated resources: 2' })).toBeVisible();
  await expect(crd.getByRole('button', { name: 'Replay' })).toBeVisible();
});

test('the expanded curriculum preserves visible results and interactive model decisions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/learn/intermediate/m09-l02/#scene-m09-l02-csi-path');
  const volume = page.locator('#scene-m09-l02-csi-path');
  await expect(volume.getByText('The application can open files at its mount path.', { exact: true }).first()).toBeVisible();
  await volume.getByRole('button', { name: 'Mount the claim', exact: true }).press('Enter');
  await expect(volume.locator('.lesson-route-row[data-arrived=true]')).toHaveCount(3);
  await expect(volume.locator('.lesson-route-message')).toHaveCount(0);

  await page.goto('/learn/advanced/m17-l02/#scene-m17-l02-hpa-formula');
  const hpa = page.getByRole('region', { name: 'HPA estimate' });
  await expect(hpa.getByRole('status')).toContainText('6 replicas');
  await hpa.getByRole('slider', { name: 'Change average CPU utilization' }).fill('100');
  await expect(hpa.getByRole('status')).toContainText('8 replicas');
  const accessibility = await new AxeBuilder({ page }).include('#scene-m17-l02-hpa-formula')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => violation.id)).toEqual([]);

  await page.goto('/learn/advanced/m18-l01/#scene-m18-l01-etcd-quorum');
  const etcd = page.getByRole('region', { name: 'etcd majority' });
  const voters = etcd.getByRole('slider', { name: 'Available voting members' });
  await voters.fill('2');
  await expect(etcd.getByRole('status')).toContainText('Writes can commit');
  await voters.fill('1');
  await expect(etcd.getByRole('status')).toContainText('New writes cannot commit');
});

test('starting a guided scene brings its diagram into view and keeps the animation running', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1150, height: 1000 });
  await page.goto('/learn/foundations/m02-l03/#scene-m02-l03-request');
  const scene = page.locator('#scene-m02-l03-request');
  const play = scene.getByRole('button', { name: 'Apply the Pod manifest', exact: true });
  await play.evaluate(button => {
    const bounds = button.getBoundingClientRect();
    window.scrollBy({ top: bounds.bottom - window.innerHeight + 1, behavior: 'instant' });
  });
  await play.click();
  const timeline = scene.getByRole('slider', { name: 'Demonstration timeline' });
  await expect.poll(async () => Number(await timeline.inputValue()), { timeout: 3500 }).toBeGreaterThan(400);
  await expect(scene.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(scene.locator('.lesson-route-row[data-arrived=true]')).toHaveCount(3, { timeout: 9000 });
});

test('alternate cases and saved steps stay in the redesigned lesson visual', async ({ page }) => {
  const lesson = '/learn/advanced/m17-l02/';
  const id = 'm17-l02-hpa-formula';
  const hash = '#scene-' + id;
  await page.goto(lesson + hash);
  const scene = page.locator(hash);

  await scene.getByText('Explore another case', { exact: true }).click();
  await scene.getByRole('link', { name: 'Request missing', exact: true }).click();
  const heading = scene.getByRole('heading', { name: 'Request missing', exact: true });
  await expect(heading).toBeFocused();
  await expect(scene.getByRole('heading', { name: 'Denominator unavailable', exact: true })).toBeVisible();
  await expect(scene.locator('.scene-player')).toHaveCount(0);
  await expect(scene.getByText('Explore another case', { exact: true })).toHaveCount(0);
  await expect(scene.getByRole('link', { name: 'Request missing', exact: true })).toHaveCount(0);

  const comparison = scene.getByRole('region', { name: 'CPU request comparison', exact: true });
  const request = comparison.getByRole('checkbox', { name: 'Set CPU request to 100m' });
  const outcome = comparison.getByRole('status');
  await expect(comparison).toBeVisible();
  await expect(comparison.getByRole('definition')).toHaveText(['80m', 'Missing', 'Undefined']);
  await expect(outcome).toHaveText('No CPU-based recommendation');
  await request.focus();
  await request.press('Space');
  await expect(comparison.getByRole('definition')).toHaveText(['80m', '100m', '80%']);
  await expect(outcome).toContainText('5 replicas');
  await request.press('Space');
  await expect(outcome).toHaveText('No CPU-based recommendation');

  await scene.getByRole('link', { name: 'Back to the main visual', exact: true }).click();
  await expect(scene.getByRole('region', { name: 'HPA estimate' })).toBeVisible();
  await expect(scene.getByText('Explore another case', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(heading).toBeVisible();

  await page.goto(lesson + '?scene=' + id + '&variant=failure&step=1' + hash);
  await expect(scene.locator('[aria-current="step"]')).toContainText('Denominator unavailable');
  await expect(scene.getByText('Explore another case', { exact: true })).toHaveCount(0);

  const pilotId = 'm05-l01-scale';
  await page.goto('/learn/foundations/m05-l01/?scene=' + pilotId + '&variant=default&step=1#scene-' + pilotId);
  const pilot = page.locator('#scene-' + pilotId);
  await expect(pilot.locator('[aria-current="step"]')).toContainText('Observe readiness separately');
  await pilot.getByRole('link', { name: 'Back to the main visual', exact: true }).click();
  await expect(pilot.getByRole('button', { name: 'Scale from 2 to 3', exact: true })).toBeVisible();
});
