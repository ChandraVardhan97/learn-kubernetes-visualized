# Verification record — 2026-10-27

The website is delivered locally. The owner explicitly chose to keep it local; there is no public deployment, connected hosting account, remote repository, or selected open-source license from this implementation. Cloudflare configuration and instructions remain available for a future publishing request.

Production preview: `http://127.0.0.1:4322/`. To recreate it, run `npm run build` and `npm run preview -- --port 4322`. Search is generated during the production build. The ignored checkout-local Node runtime is 22.23.4; `.node-version` pins the supported baseline for another machine.

## Scope and automated verification

| Evidence | Final result |
| --- | --- |
| `npm run check` | Zero Astro/TypeScript errors, warnings or hints; 60 lessons, 20 modules, 195 concepts, 121 scenes; no missing references or prerequisite cycles |
| `npm test` | 13 passing tests across domain/progress invariants and publication-asset protections |
| `npm run verify:labs` | 20 module labs, 122 identical canonical downloads, 55 Kubernetes documents; Bash/Python/YAML validation passed |
| `npm run build` | 66 static pages, Pagefind index for all 60 lessons, publication guard passed for public and generated assets |
| `npm run test:e2e` | Five passing production Chrome journeys, including all three levels, scene variants, readiness/reconciliation, two-tab progress, bookmarks, export/import and invalid import preservation, keyboard search, deep links, mobile navigation focus and reduced-motion wrap |
| Accessibility | Axe WCAG 2 A/AA and 2.1 AA checks reported no violations on the sampled mobile lesson; Lighthouse accessibility 100 on all three audited pages |
| Local HTTP smoke check | All 65 normal HTML routes returned content; sampled bundle/config/script/search assets returned 200; missing route returned custom 404 |
| Visual review | Production screenshots inspected at 1440px, 768px and 390px, dark mobile lesson and light desktop homepage/reference lesson; no horizontal overflow in the browser journeys |
| Design inspection | Zero failures, one defended editorial-title warning; source lint zero failures, two floating-overlay shadow warnings |
| Review fixes | All four independent review findings addressed: private backups/publication guard, readiness preservation, fresh cross-tab progress updates, hidden mobile navigation focus |

The content-to-scene inventory is [COVERAGE.md](COVERAGE.md). The initial independent technical review sampled eight lessons. The subsequent [full curriculum audit](CONTENT-AUDIT.md) covers all 60 lessons and every base/alternate scene state and supersedes that sampling boundary. Automated coverage establishes that every declared concept resolves to a lesson and an embedded scene, with no missing references. It cannot judge the full quality of an explanation; future subject-matter reviews can continue improving teaching depth.

## Performance

Measured against the final static production preview with mobile Lighthouse defaults:

| Page | Performance | Accessibility |
| --- | ---: | ---: |
| Homepage | 100 | 100 |
| Foundations: m05-l01 | 100 | 100 |
| Advanced: m16-l02 | 99 | 100 |

All generated application JavaScript combined is **120.6 KiB gzip**, a conservative upper bound below the 250 KiB initial-lesson target. Deferred Pagefind search assets are excluded from that total. Scores are local measurements, not a promise for every device or future deployment. The ignored HTML reports and summary are under `output/lighthouse/`.

## Real local labs

Used Docker Desktop, kind 0.33.0, the digest-pinned Kubernetes 1.37.0 node image and a checksum-verified kubectl 1.37.0 client. The matching-client integration run passed m01–m19 and exposed a zero-byte raw-stdin restore in m20. The final m20 procedure uses `kubectl cp` for its bounded fixture and passed all three capstones, comparing the exact 19 bytes and SHA-256 digest before and after Pod replacement. No retry masks a failed comparison. The cause of the earlier transfer failure is unproven.

All 55 manifest documents previously passed strict server-side dry-run against the real API after establishing their admission prerequisites. The optional isolated etcd recovery also restored and read its saved marker. The final private-host-output correction was verified separately; the complete etcd recovery was not repeated after that path-only change. See [labs-report.md](labs-report.md) for exact execution history and limits.

The lab bundle has 124 allowlisted entries, including shared setup files; ZIP CRC and every entry's bytes match the canonical downloads. Runtime snapshots and recovery credentials default to private OS temporary paths, outside the public tree. The build/deployment guard rejects unreviewed lab artifacts and credential-like files. The temporary `kv-lab` and `kv-recovery` clusters created for verification have both been removed. Docker itself remains available to the owner.

## Deliberate limits

- Metrics Server, VPA, Argo CD, CSI snapshot support, Ingress/Gateway controllers, mesh and full telemetry stacks were not installed. Their lessons identify add-on prerequisites and distinguish upstream mechanisms from local approximations.
- A same-host kind cluster does not prove production HA, fault-domain resilience or cloud storage guarantees. The stateful file fixture is not a database-consistent backup. The operator lab uses a small polling controller rather than production informers and leader election.
- No deployed-host deep-link, download or search verification is claimed. Repeat the deployment checklist when the owner chooses to publish.
- Browser data stays on this origin. Export progress before clearing browser data or moving to another hostname. There is no server sync or account system.

## Evidence and reproduction

Run the README commands to reproduce source/content/unit/build checks. Start the production preview before `npm run test:e2e` and `npm run audit:performance`. Real labs require the prerequisites and disposable-cluster setup in [LABS.md](LABS.md).

Build/check logs are retained in `/tmp/kv-*-release.log`; the matching-client lab run is `/tmp/kv-labs-supported-client-all.log` and final capstones are `/tmp/kv-capstones-final.log`. These machine-local logs are not published downloads. Screenshots, browser traces, design-inspector artifacts and Lighthouse reports are ignored local review outputs. [DESIGN-REVIEW.md](DESIGN-REVIEW.md) records the visual decisions and justified warnings.


## UI refinement verification

After the owner's visual feedback, the shared UI, labs catalogue, diagram presentation and appearance control were refined. Final source diagnostics still report zero errors/warnings/hints, all 13 unit checks pass, and the updated five production browser journeys pass (18.3 seconds in the final run). The source check covers 39 Astro/source files and retains the same 60/20/195/121 content inventory.

The browser journeys additionally verify lab level/search filters, empty results, setup disclosure, a deep-linked capstone, persisted dark preference and keyboard focus after dismissing the appearance panel. The actual in-app browser was used to inspect the formerly broken theme control in light and dark modes. The final performance table above supersedes the initial release measurements. The all-application JavaScript bound is now 120.6 KiB gzip.

Final design inspections of home, labs and the reference lesson report zero failures at 1440px, 768px and 390px. Their remaining editorial-title/active-state warnings and the screenshot critique are recorded in [DESIGN-REVIEW.md](DESIGN-REVIEW.md). No lab manifest or procedure changed in this UI pass, so cluster-mutating lab execution was not repeated. Public/dist publication guards still pass. The final logs use `/tmp/kv-refine-*.log`.


## 2026-10-28 — full documentation audit verification

The [audit](CONTENT-AUDIT.md) covers all 60 lessons, 121 scenes, 121 alternate paths and 769 narrated states. The source-link inventory records 186 entries / 140 distinct URLs, all reachable after corrections. Semantic review and HTTP reachability are recorded separately.

Fresh source/content checks report zero errors, warnings or hints; all 13 domain/progress/publication tests pass. Canonical lab validation passes for 20 modules / 122 downloads / 55 documents, and all 55 manifest documents also pass strict dry-run against the real Kubernetes 1.37 API. The final production build generates 66 pages, indexes all 60 lessons and passes both publication guards.

Changed m03, m04, m06, m08, m12 and m16 runners pass on the clean disposable cluster, including m08 repeated without cleanup. The m20 platform capstone also passes with the corrected CRD. [labs-report.md](labs-report.md) records exact observations, failed initial attempts and remaining execution boundaries. The task-owned cluster has been removed; no site was deployed.

The earlier performance/design measurements remain applicable to the unchanged rendering system; they were not remeasured as part of this content audit. The About page now states the review scope, baseline and limits.


Final production browser run: **5 passed in 10.5 seconds**, including consistency between GPU selection, YAML nodeSelector/CPU request, feasible placement and Pending state. The test waits for the deferred island's enabled animation controls before opening the experiment. An initial browser invocation stopped because the preview was absent; it was restarted on port 4322. An intermediate test attempt clicked the server-rendered disclosure before deferred hydration completed; the test now uses the same readiness condition as the animation journey. No browser success is inferred from those failed attempts.

Fresh local HTTP verification passed for **all 65 normal HTML routes**, the About accuracy note, corrected API-version prose, the downloaded bundle's SHA-256, and the custom missing-route 404. The final bundle has 124 entries / 83,377 bytes with exact-byte and ZIP CRC checks. Logs: `/tmp/kv-content-audit-check.log`, `/tmp/kv-content-audit-unit.log`, `/tmp/kv-content-audit-build.log`, `/tmp/kv-content-audit-browser.log`. The local production preview remains at `http://127.0.0.1:4322/`.


## 2026-10-28 — complete website functionality check

The [functionality audit](FUNCTIONALITY-AUDIT.md) found and fixed two hydration defects missed by earlier click-only checks: empty server-rendered SVG node titles and reduced-motion first-render button text. Existing browser journeys now assert there are no uncaught browser errors. The final five journeys pass (12.1 seconds), as do all 13 unit checks, source/content validation, the production build and canonical lab validation.

Full browser sweeps cover all 60 lessons / 121 scenes / 121 alternate branches / 769 narrated states in normal and reduced-motion modes. Fifty interactive mechanism combinations, playback/pause/offscreen behavior, share-link restoration, progress and import/export edge cases, unavailable-storage fallback, search, themes, lab filters/downloads, mobile navigation and JavaScript-disabled reading pass. The final static/HTTP audit finds no broken targets among 3,178 internal links and 2,396 fragments; all 126 linked assets/downloads match generated bytes. All 65 normal routes and the custom 404 pass.

These are local Chrome results, including emulated mobile viewports. No hosting deployment, new cluster execution or physical-device cross-browser verification is claimed.


## 2026-10-28 — shared dropdown correction

Replaced the remaining two native select types in ScenePlayer with a shared styled select-only combobox: speed and scenario selection. All **242 controls across 60 lessons / 121 scenes** passed a production-browser selection sweep. Arrow spacing uses a separate 16px column and 13–14px trigger padding; settled captures measured 14–15px from SVG bounds to the trigger's outer edge. Open menus use rounded, padded options and existing theme tokens, and render in the browser top layer so the scene's overflow boundary cannot clip them.

Production screenshots for both menus were viewed in light and dark at 1440px, 768px and 390px. All six theme/width cases passed bounds, selection, keyboard commit/cancel, typeahead/Tab and outside-dismissal checks. Two targeted regressions also pass: an offscreen trigger closes its popup, and selecting the current scenario again preserves the current animation step. The latter avoids resetting a lesson merely to dismiss the selected option.

The existing five browser journeys now operate the new controls, preserve their reduced-motion disabled behavior, test scroll dismissal and unchanged selection, and run Axe with an actual scenario menu open. Final result: **five passed in 11.9 seconds**, no uncaught browser errors. All **13 unit checks** pass. Source/content checks report zero errors/warnings/hints; the 66-page production build, 60-lesson search index and public/dist guards pass. The internal-link/asset check still passes with no duplicate IDs, missing targets or mismatched downloads. No lab data or Kubernetes semantics changed.

Design inspection reports **0 FAIL / 2 WARN** at the target widths; the warnings and screenshot critique are documented in [DESIGN-REVIEW.md](DESIGN-REVIEW.md). Local evidence is under ignored `output/playwright/dropdowns/`, `.taste-skill/dropdowns-final/` and `/tmp/kv-dropdown-*.log`. Browser checks use Chrome with emulated phone/tablet viewports. No new dependencies, cluster actions or deployment were introduced.

## 2026-11-18 — flow diagram and motion review

Reviewed the normal and alternate sequences across all 60 lessons, with particular attention to which relationships each step highlights. The API rejection, expired-watch, scheduler, operator, quorum, GitOps, and recovery sequences now show the boundary where work stops or resumes. The ownership lesson shows one ReplicaSet owning all three Pods. The scheduling experiment depicts both rejected candidates, and its access-control counterpart marks later gates as unevaluated after an upstream failure. [Admission control](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/), [Kubernetes API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/), [Scheduling Framework](https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/), [Owners and Dependents](https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/), [etcd quorum](https://etcd.io/docs/v3.7/faq/).

The shared renderer assigns stable positions to object identities, routes connectors through the space between nodes, and marks blocked paths with a dashed line and a stop mark. Short fades on changed labels and relationships guide attention as scenes advance. Playback pauses when its diagram leaves the viewport. Reduced motion offers discrete steps. This treatment uses shared-element continuity as a motion principle. [Google Material motion choreography](https://m1.material.io/motion/choreography.html).

Chrome sweeps stepped through all 121 scenes and 769 frames at desktop width and at 390px with reduced motion. Each sweep checked authored state against the rendered diagram and the 1,017 relationship instances. The desktop sweep sampled connector paths for node crossings and canvas bounds, and both checked stable object positions and visible text bounds in their respective layouts. The production build, 13 unit checks, five browser journeys including Axe, and 50 live experiment combinations passed. The content validator now also checks for overlapping nodes, out-of-bounds positions, and unroutable connections. Local screenshots cover 1440px, 768px, and 390px in light and dark examples.
