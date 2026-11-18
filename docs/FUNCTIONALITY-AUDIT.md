# Website functionality audit

Verified 2026-10-28 against the local static production preview at `http://127.0.0.1:4322/`. All checks below passed after two initial-load defects were corrected. This report concerns website behavior; the separate [content audit](CONTENT-AUDIT.md) covers Kubernetes explanations and [lab report](labs-report.md) records actual cluster execution.

## Defects found and fixed

The original five browser journeys passed because React recovered from hydration errors before later interactions. The broader sweep captured uncaught browser errors and exposed two independent problems:

1. **Diagram accessible titles differed between server and browser.** Node `<title>` elements received an array of JSX children. React's server renderer emitted empty titles, while the client expected label/detail text, causing hydration recovery for the entire island. Each title now receives one string. The first six-lesson sweep reproduced 12 hydration errors before the fix; the same scenes and the full curriculum pass afterward.
2. **Reduced motion changed the first-render button text.** The server rendered “Play,” but the first browser render could render “Advance” immediately from its media query. The reduced-motion UI now takes effect after the matching initial hydration render; controls stay disabled during that handoff. The existing reduced-motion journey caught this second defect after the title fix. Its narrow development reproduction and the final full reduced-motion sweep pass after correction.

These are server/client rendering failures, not merely console noise: recovery rebuilds the island and can discard an early native disclosure interaction. React documents this recovery behavior in its [hydration error reference](https://react.dev/errors/418).

The existing browser journeys now fail on uncaught page errors from every page in their browser context, including additional lesson tabs. No new presentation tests or component snapshots were added. The permanent suite remains five browser journeys and 13 unit checks. Larger one-off interaction sweeps are ignored local audit artifacts.

## Executed coverage

| Feature | Verification and result |
| --- | --- |
| Every lesson scene | All 60 lessons / 121 scenes / 121 alternate branches / 769 narrated states exercised in the production browser, with no uncaught browser errors. |
| Scene consistency | Every visited frame matched its authored narration, diagram title, node count and supported state code. This tests state/render synchronization; technical semantics are covered separately by the content audit. |
| Scene controls | Forward/back boundaries, reset, timeline, variant selection and full transcript counts checked in every scene. Normal and reduced-motion full sweeps each covered all 769 states. |
| Timed playback | Real timer advancement at 2× speed, pause cancellation, and offscreen pausing verified. Reduced-motion Advance controls and disabled speed control verified. |
| Shared scenes | Clipboard-generated link included scene, variant and step; navigating to it restored the selected branch and step. |
| Interactive mechanisms | All 50 exposed input combinations across scheduling, Service endpoints, storage, authorization and operator experiments passed. Displayed YAML/results stayed synchronized. |
| Homepage cluster | Scale up/down, deletion to zero, disabled empty deletion and reconstruction from zero passed; existing unit/browser checks also cover readiness versus replica count. |
| Progress | Completion/uncompletion, bookmark/unbookmark, reload persistence, resume link, cross-tab updates, deduplicated known-ID import, malformed/unsupported/structurally invalid/oversized import protection, export payload and import persistence passed. |
| Unavailable storage | A separate controlled browser context made Storage access throw SecurityError. Page-only completion remained usable and showed its storage-unavailable notice. |
| Search | Keyboard opening, real indexed results, result navigation, genuine empty query results and Escape dismissal passed. |
| Concept atlas | All 195 concepts present; filtering, clear and zero-result state passed; existing journey checks concept-to-scene navigation. |
| Themes | Light, dark and system settings, explicit preference persistence, system light/dark resolution and keyboard dismissal passed. |
| Labs | All level counts, search/zero results, setup disclosure, direct setup link, a hash revealing a filtered-out capstone and actual ZIP download passed. |
| Internal links | All 65 normal pages served successfully. 3,178 internal link occurrences and 2,396 fragment occurrences resolved; no duplicate IDs or missing targets found. |
| Assets / downloads | All 126 unique linked assets/downloads fetched and matched generated files byte for byte. ZIP has 124 entries, passes CRC and matches every published member. Missing routes return the custom HTTP 404. |
| Responsive navigation | Home, curriculum, atlas, labs, intermediate and advanced lesson checked at 1440px, 768px and 390px: 18 page/width combinations, no horizontal overflow. Mobile menu and link navigation passed. |
| Reading without JavaScript | A separate JavaScript-disabled browser context could read lesson prose and open the complete native transcript. Interactive simulations and search require JavaScript. |
| Keyboard / accessibility | Existing production journey passed keyboard navigation focus, reduced-motion step wrap, theme focus restoration and Axe WCAG 2 A/AA + 2.1 AA on the sampled mobile lesson. |

## Source and build checks

- `npm run check`: zero errors, warnings or hints; 60 lessons, 20 modules, 195 concepts and 121 scenes resolve without prerequisite cycles.
- `npm test`: all 13 tests pass.
- `npm run test:e2e`: all five production journeys pass with uncaught-error assertions enabled, final run 12.1 seconds.
- `npm run verify:labs`: 20 module labs, 122 identical canonical files, 55 Kubernetes documents and script syntax pass. Kubernetes execution from the earlier audit was not repeated for these frontend-only changes.
- `npm run build`: 66 static pages, search index for all 60 lessons, public/dist asset guards pass.

## Evidence and limits

Browser checks used Chrome on this machine. Mobile checks emulate viewport and media preferences; physical iOS/Android devices and Safari/Firefox were not exercised. No claim of deployed Cloudflare verification is made; the site remains local at the owner's request. The full local cluster suite and optional controllers were not rerun for this UI behavior audit.

Raw scene results, tools results, link results, reproduction snippets, exported test data and the mobile screenshot are under ignored `output/playwright/functionality/`. Playwright CLI browser logs are ignored under `.playwright-cli/`. Logs use `/tmp/kv-functionality-*.log`. Temporary audit browsers and the development server are closed after verification; the production preview remains available for the owner. The audit never accesses the owner's saved browser progress.

Some audit scripts initially failed because of their own assumptions: a speed-control locator was too strict, the CLI sandbox does not support dynamic Node imports, and a multiword “empty result” fixture legitimately matched indexed text. Those were corrected in the ignored audit scripts; no website change was made for those harness failures. Only the two reproduced hydration defects required application changes.


## Dropdown refinement addendum

Following visual feedback, speed and scenario selectors now use a shared styled select-only combobox. A separate production sweep passed all 242 controls in all 60 lessons. Existing journeys were updated to exercise the new controls, including cancellation, unchanged selection, scroll dismissal and an open-menu Axe scan; all five still pass. See [VERIFICATION.md](VERIFICATION.md) and [DESIGN-REVIEW.md](DESIGN-REVIEW.md) for the final evidence. The earlier full-state/technical review remains applicable to unchanged simulation data.
