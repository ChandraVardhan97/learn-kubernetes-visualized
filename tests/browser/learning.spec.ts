import {test,expect,type Locator} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import {parse} from 'yaml';

// Hydration recovery can hide errors while later clicks still appear to work.
const browserErrors=new WeakMap<object,string[]>();
test.beforeEach(async({context})=>{
 const errors:string[]=[];browserErrors.set(context,errors);
 const observe=(page:import('@playwright/test').Page)=>page.on('pageerror',error=>errors.push(error.message));
 context.pages().forEach(observe);context.on('page',observe);
});
test.afterEach(async({context})=>{expect(browserErrors.get(context)??[],'No uncaught browser or hydration errors').toEqual([]);});

test('replicas and readiness teach different observed behaviors',async({page})=>{
 await page.goto('/');
 const model=page.locator('.live-cluster');
 await model.getByRole('slider',{name:'Desired replicas'}).fill('4');
 await model.getByRole('button',{name:'Reconcile',exact:false}).click();
 await expect(model.locator('.live-state')).toContainText('Observed 4');
 await model.getByRole('button',{name:'Toggle readiness'}).click();
 await expect(model.locator('.live-state')).toContainText('Ready 3');
 await expect(model.locator('.live-state')).toContainText('Observed 4');
 await model.getByRole('button',{name:'Reconcile',exact:false}).click();
 await expect(model.locator('.live-state')).toContainText('Ready 3');
 await model.getByRole('button',{name:'Delete a Pod'}).click();
 await expect(model.locator('.live-state')).toContainText('Observed 3');
});

test('parallel lesson tabs preserve completion and bookmarks',async({page,context})=>{
 await page.goto('/learn/foundations/m01-l01/');
 const second=await context.newPage();await second.goto('/learn/intermediate/m07-l01/');
 await second.getByRole('button',{name:'Bookmark lesson',exact:true}).scrollIntoViewIfNeeded();
 await expect(second.getByRole('button',{name:'Bookmark lesson',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Mark complete',exact:true}).scrollIntoViewIfNeeded();
 await page.getByRole('button',{name:'Mark complete',exact:true}).click();
 await second.getByRole('button',{name:'Bookmark lesson',exact:true}).click();
 await page.goto('/curriculum/');
 await expect(page.locator('.progress-panel')).toContainText('1 of 60 lessons completed');
 await expect(page.locator('.bookmark-list li')).toHaveCount(1);
 await second.close();
});

test('learning path, scene branches, completion and bookmarks work',async({page})=>{
 await page.goto('/curriculum/');
 for(const level of ['foundations','intermediate','advanced']){
  const link=page.locator(`#${level} .module-lessons a`).first();
  const href=await link.getAttribute('href');expect(href).toBeTruthy();
  await page.goto(href!);
  const scene=page.locator('.scene').first();await scene.scrollIntoViewIfNeeded();
  await scene.getByRole('button',{name:'Next',exact:true}).click();
  await expect(scene.locator('.stage-caption')).toContainText('Step 2');
  const scenario=scene.getByRole('combobox',{name:'Explore a scenario',exact:true});
  await scenario.click();
  await expect(scenario).toHaveAttribute('aria-expanded','true');
  await page.getByRole('listbox',{name:'Explore a scenario',exact:true}).getByRole('option').nth(1).click();
  await expect(scenario).toHaveAttribute('aria-expanded','false');
  await expect(scene.locator('.stage-caption')).toContainText('Step 1');
  await scene.getByRole('button',{name:'Next',exact:true}).click();
  await scenario.click();
  await page.getByRole('listbox',{name:'Explore a scenario',exact:true}).getByRole('option',{selected:true}).click();
  await expect(scene.locator('.stage-caption')).toContainText('Step 2');
  const speed=scene.getByRole('combobox',{name:'Speed',exact:true});
  await speed.click();
  await page.getByRole('listbox',{name:'Speed',exact:true}).getByRole('option',{name:'2×',exact:true}).click();
  await expect(speed).toContainText('2×');
  await speed.press('Home');await speed.press('Escape');
  await expect(speed).toContainText('2×');await expect(speed).toBeFocused();
  await speed.press('Home');await speed.press('Enter');await expect(speed).toContainText('0.5×');
  await speed.click();
  await page.getByRole('button',{name:'Mark complete',exact:true}).scrollIntoViewIfNeeded();
  await expect(speed).toHaveAttribute('aria-expanded','false');
  await page.getByRole('button',{name:'Mark complete',exact:true}).click();
  await page.getByRole('button',{name:'Bookmark lesson',exact:true}).click();
  await page.goto('/curriculum/');
 }
 // A teaching control must update the supported manifest and observed placement together.
 await page.goto('/learn/intermediate/m07-l01/');
 const teachingScene=page.locator('.scene').first();
 await teachingScene.scrollIntoViewIfNeeded();
 await expect(teachingScene.getByRole('button',{name:'Next',exact:true})).toBeEnabled();
 const experiment=page.locator('.mechanism-experiment');
 await experiment.locator('summary').click();
 await experiment.getByRole('checkbox',{name:'Require a GPU-labelled node'}).check();
 const manifest=parse(await experiment.locator('pre code').innerText());
 expect(manifest.spec.nodeSelector.accelerator).toBe('gpu');
 expect(manifest.spec.containers[0].resources.requests.cpu).toBe('1');
 await expect(experiment.locator('.scene-narration')).toContainText('Bind to worker-b');
 await experiment.getByRole('slider',{name:'CPU request',exact:true}).fill('2');
 expect(parse(await experiment.locator('pre code').innerText()).spec.containers[0].resources.requests.cpu).toBe('2');
 await expect(experiment.locator('.scene-narration')).toContainText('Keep the Pod Pending');
 await page.goto('/curriculum/');
 await expect(page.locator('.progress-panel')).toContainText('3 of 60 lessons completed');
 await expect(page.locator('.bookmark-list li')).toHaveCount(3);
 await page.reload();await expect(page.locator('.progress-panel')).toContainText('3 of 60 lessons completed');
 const exported=page.waitForEvent('download');await page.getByRole('button',{name:'Export progress'}).click();
 const download=await exported;const exportPath=await download.path();expect(exportPath).toBeTruthy();
 await page.locator('input[type=file]').setInputFiles(exportPath!);
 await expect(page.getByRole('status')).toContainText('Progress imported and merged');
 await expect(page.locator('.progress-panel')).toContainText('3 of 60 lessons completed');
 const before=await page.evaluate(()=>localStorage.getItem('kubernetes-visualized:progress:v1'));
 await page.locator('input[type=file]').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{not valid')});
 await expect(page.getByRole('status')).toContainText(/JSON|valid|Unexpected|property/i);
 expect(await page.evaluate(()=>localStorage.getItem('kubernetes-visualized:progress:v1'))).toBe(before);
});

test('search finds rendered lesson text and direct anchors resolve',async({page})=>{
 await page.goto('/');await page.keyboard.press('ControlOrMeta+k');
 const search=page.locator('#search-dialog').getByRole('textbox',{name:'Search',exact:true});await search.fill('readiness');
 await expect(page.locator('.pagefind-ui__result').first()).toBeVisible();
 await page.getByRole('button',{name:'Close search'}).click();await page.goto('/concepts/');
 await page.getByRole('searchbox',{name:'Filter concepts'}).fill('readiness');
 const link=page.locator('.concept-row:not([hidden]) a').first();await link.click();
 const hash=new URL(page.url()).hash;expect(hash).toMatch(/^#scene-/);await expect(page.locator(hash)).toBeVisible();
 await page.goto('/labs/');
 await page.getByRole('button',{name:'Advanced 7',exact:true}).click();
 await expect(page.locator('.lab-section:visible')).toHaveCount(7);
 await page.getByRole('searchbox',{name:'Find an exercise'}).fill('snapshot');
 await expect(page.locator('.lab-section:visible')).toHaveCount(1);
 await expect(page.locator('#m18')).toBeVisible();
 await page.getByRole('searchbox',{name:'Find an exercise'}).fill('unmatched-fixture-query');
 await expect(page.locator('#lab-empty')).toBeVisible();
 await page.goto('/labs/#m20');await expect(page.locator('#m20')).toBeVisible();
 await page.getByRole('link',{name:'Set up your cluster',exact:true}).click();
 await expect(page.locator('#setup')).toHaveAttribute('open','');
});

test('copy preserves static commands and current interactive YAML', async ({page, context}) => {
 await context.grantPermissions(['clipboard-read', 'clipboard-write']);

 async function copyBlock(pre: Locator) {
  const text = await pre.locator('code').textContent();
  expect(text).toBeTruthy();
  const snippet = pre.locator('..');
  await snippet.getByRole('button', {name: 'Copy code', exact: true}).press('Enter');
  await expect(snippet.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
 }

 await page.goto('/labs/#setup');
 await copyBlock(page.locator('#setup pre').filter({hasText: 'kind create cluster'}));

 await page.goto('/learn/intermediate/m07-l01/');
 await copyBlock(page.locator('pre.astro-code').first());

 const scene = page.locator('.scene').first();
 await expect(scene.getByRole('button', {name: 'Next', exact: true})).toBeEnabled();
 const experiment = scene.locator('.mechanism-experiment');
 await experiment.locator('summary').click();
 const yaml = experiment.locator('pre');
 await copyBlock(yaml);
 await experiment.getByRole('slider', {name: 'CPU request', exact: true}).fill('2');
 await expect(yaml).toContainText('cpu: "2"');
 await copyBlock(yaml);
});

test('production layout, reduced motion and accessibility',async({page})=>{
 fs.mkdirSync('output/playwright',{recursive:true});
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:1000});await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`output/playwright/home-${width}.png`,fullPage:true});
 }
 await page.reload();await page.keyboard.press('Tab');
 await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
 await page.keyboard.press('Tab');
 await expect(page.getByRole('button',{name:'Open learning navigation'})).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('link',{name:'Kubernetes Visualized home'})).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Open learning navigation'})).toBeFocused();
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/curriculum/');
 const href=await page.locator('.module-lessons a').first().getAttribute('href');await page.goto(href!);
 const scene=page.locator('.scene').first();await scene.scrollIntoViewIfNeeded();
 await expect(scene.getByRole('button',{name:'Advance animation one step'})).toBeVisible();
 await expect(scene.getByRole('combobox',{name:'Speed',exact:true})).toBeDisabled();
 const steps=Number((await scene.locator('.stage-caption').innerText()).match(/of (\d+)/)![1]);
 for(let i=0;i<steps;i++)await scene.getByRole('button',{name:'Advance animation one step'}).click();
 await expect(scene.locator('.stage-caption')).toContainText('Step 1 of');
 await scene.getByRole('combobox',{name:'Explore a scenario',exact:true}).click();
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Color theme',exact:true}).click();
 await page.getByRole('radio',{name:/^Dark/}).check();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Color theme',exact:true})).toBeFocused();
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.screenshot({path:'output/playwright/lesson-mobile-dark.png',fullPage:false});
});
