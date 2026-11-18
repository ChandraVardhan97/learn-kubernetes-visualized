# Implementation ledger — Kubernetes, Visualized

Plan: docs/superpowers/plans/2026-10-27-kubernetes-visualized.md

- Approved design and plan persisted. Empty repository, no baseline implementation or tests.
- Ruling: use the new feature branch in the existing empty checkout — an unborn repository cannot create a conventional detached worktree; there is no existing work to isolate — changes remain reviewable in the requested workspace.
- Ruling: use sequential delegated curriculum authoring with shared UI implemented by the owner; content files are isolated by level — maintains domain depth without conflicting edits — integration must validate scene references.
- Preflight: lessons consume Scene IDs and stable module IDs; Scene consumes JSON Frame contract; labs consume module IDs; all share docs/CONTENT-CONTRACT.md.
- Dependency installation pending; actual available npm/runtime versions will be verified against registry rather than assuming documentation versions exist.
- Task 1: content contracts/schema, module inventory and approved docs persisted; Astro7.4.2 with project-local Node22.23.4 installed; feature branch codex/kubernetes-visualized.
- Task 2: responsive framed-sheet shell, live reconciliation model, lesson routes and narrated scene player implemented; first browser review corrected overlapping Pod geometry.
- Task 3: search integration, atlas, local progress/bookmarks/export/import and bounded mechanism parameter experiments implemented. Domain/progress tests:9 passed.
- Task 4: foundations author validated18lessons/36scenes/64concepts; shared production build successful with18lesson pages. Intermediate and advanced content in progress.
- Ruling: current kind0.33 contains NetworkPolicy enforcement inherited from kind0.24 — test actual deny/allow behavior instead of repeating the earlier outdated default-CNI assumption — incorrect claims would mislead learners.
- Lab environment: started existing Docker Desktop; created named disposable kv-lab three-node cluster with digest-pinned Kubernetes1.37.0; local-labs author is the sole cluster mutator during integration.
- Hosting discovery: wrangler4.153.0 reports unauthenticated; no deployment yet. Do not substitute expiring anonymous hosting for the approved durable account deployment.
- Task 5:21 intermediate lessons/42scenes/88concepts authored; scoped MDX/YAML/Bash checks passed. Primary-source/optional-addon boundaries documented.
- Task 6: all60lessons now on disk. Global content check passes:20modules,195concepts,121scenes;0Astro errors/warnings/hints. Full advanced author report pending.
- Task 7 lab evidence: all20 integrations, three capstones,55strict server-side dry-runs, and optional offline etcd recovery passed; see docs/labs-report.md. ZIP verified canonical allowlist; no backup/kubeconfig paths in public assets.
- Browser verification: replica/readiness, responsive/reduced-motion/accessibility, search/deep links passed. A new reduced-motion wrap regression was reproduced (last Advance skipped first step); handler corrected; fresh full run pending rebuild.
- Performance measured before final minor UI changes: homepage96/100, foundations100/100, advanced98/100 (performance/accessibility); all application JS120KiB gzip, deferred Pagefind excluded. Final audit will refresh these measurements.
- Visual lint0FAIL; two allowed overlay-shadow warnings. Inspector found tiny SVG text and menu glyph; fixed to11px minimum/SVG icon, final screenshots pending.
- Cloudflare OAuth initiated for the user's account; publication remains dependent on successful authorization. No temporary anonymous deployment substituted.
- User steering: keep the website local for now. No Cloudflare publication or remote repository changes are authorized in this run; deployment docs/config remain ready for a later request. OAuth attempt timed out.
- Independent final review output/code-review.md requested4fixes: backup publication path(P1), fabricated readiness(P2), multi-tab progress overwrite(P2), hidden mobile keyboard targets(P2). All are being addressed in one fix pass.
- Fixed readiness preserves retained Pods; browser regression reproduced Ready4 vs expected3 before fix and nowpasses.
- Fixed latest-state progress mutations and cross-tab storage refresh; two-tab repro lost completion before fix and nowpasses.
- Fixed mobile closed sidebar visibility and focus return; keyboard repro entered hidden navigation before fix and nowpasses.
- Fixed reduced-motion wrap; observed step2 instead ofstep1 at wrap before fix; final5-browser suite passed after correction.
- Added fail-closed canonical lab asset allowlist and private-artifact checks before/after builds and deployment. Regression tests observed3failures before implementation; now13unitchecks pass. Generated dist/labs/index.html is explicitly permitted only in dist.
- Lab author moved m18/m20 backups to private user-specific OS temp paths and rejected paths/symlinks into public/dist. Direct default m18 capture and m20 recovery passed; archive regeneration pending client preflight updates.
- Discovered actual global kubectl1.32.2 was unsupported for cluster1.37.0. Installed checksum-verified official kubectl1.37.0 at .runtime/bin/kubectl; rerunning all20labs once with matchingclient and explicit version preflight. Historical untraced m20 content-assertion failure remains documented; no claim that skew caused it.
- UI lint0FAIL, only allowed overlay-shadow warnings. Production inspector0FAIL at1440/768/390; final mobile readability adjustments now source-complete, refreshed screenshots pending finalbuild.

- Supported-client integration run passed m01–m19 and reproduced m20 stdin restore returning exit0 with zero actual bytes. No root cause is asserted. Replaced that bounded fixture transfer with standard kubectl cp (tar available); five isolated copies and the entire three-capstone m20 runner passed. Both restoration checkpoints matched19bytes/SHA-256 before/after Pod replacement. No retries added.
- Updated m18/m20 lesson commands and m20 scenes to private paths/file-copy behavior. Repacked ZIP:124canonical entries,81271bytes; exactbytes and CRC verified.
- Final sequential build succeeded:66staticpages,60indexedlessons; public/dist publication checks passed. Check has0errors/warnings/hints;13unitchecks and5productionbrowserjourneys pass. All65normalHTTPpageURLs and sampled downloads/search assets pass; missingroute returns404.
- Final Lighthouse mobile scores performance/accessibility:home97/100,foundations99/100,advanced100/100; allapplicationJS120.3KiBgzip. Finaldesigninspector0FAIL/1defendededitorialtitleWARN; sourcelint0FAIL/2overlaywarnings. Production screenshots viewed atall3widths and darkmobilelesson.
- Final cleanup removed only task-createdkv-lab; kv-recovery alreadyremoved. Added docs/VERIFICATION.md and docs/DESIGN-REVIEW.md with evidence and limitations. Production preview4322 is retained for localuse; nothingpublished.

- Owner requested a less generic, more elegant UI and supplied the unreadable native theme popup. Retained framed-sheet/Plex/blue; refined hierarchy, navigation, reading/scene surfaces, topology illustration and browsable lab catalogue. Replaced theme native options with a styled appearance popover and native radios, retaining kv-theme persistence.
- UI refinement final checks:39sourcefiles,0diagnostics;60lessons/20modules/195concepts/121scenes unchanged;13unitchecks pass;5updatedbrowserjourneys pass, including filters/appearance/keyboard/storage. Production build and public/dist guards pass.
- Final refined mobile Lighthouse performance/accessibility:home100/100,foundations100/100,advanced99/100. ApplicationJS120.6KiBgzip. Home/labs/reference inspectors each0FAIL; editorialtitle and semanticactiveoutline warnings documented. All final folds/composites and actual in-app light/dark appearance viewed. No publication or cluster mutation in this refinement.


## 2026-10-28 — full primary-source correctness audit

Reviewed all 60 lessons, 121 scenes and 769 base/alternate narrated states. Corrected documented mechanisms and inconsistent labels/values, aligned optional exercises with their actual baseline lab coverage, and withdrew the unsupported Argo CD install recipe. See [CONTENT-AUDIT.md](CONTENT-AUDIT.md) and its three per-level reports for findings and boundaries. Canonical downloads and the 124-file bundle were synchronized. The site remains local at the owner’s request. Fresh checks and execution results are recorded in [VERIFICATION.md](VERIFICATION.md) and [labs-report.md](labs-report.md).


## 2026-10-28 — website functionality audit

Checked complete scene/state coverage and all exposed learning-tool flows in isolated production browsers. Fixed SVG node title hydration and reduced-motion initial-render hydration. Added uncaught browser-error assertions to the existing five journeys. The [functionality audit](FUNCTIONALITY-AUDIT.md) records full coverage, passing checks, evidence and browser/environment limits. No new feature scope, hosting publication or cluster changes were introduced.


## 2026-10-28 — consistent dropdown menus

Replaced native speed/scenario dropdowns with one SelectControl component using themed, rounded top-layer menus, separate chevron spacing, keyboard navigation and responsive option wrapping. Verified all 242 controls across 60 lessons, light/dark at three widths, and existing production/domain checks. Corrected scroll dismissal and preserved the animation step when the current scenario is reselected. The final five browser journeys include open-menu accessibility checks. No dependencies, learning content, lab assets or deployment changed.
