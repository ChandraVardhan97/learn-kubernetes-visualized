# Kubernetes, Visualized — approved implementation plan

Goal: a complete public-ready Kubernetes visual textbook covering practical operations and internals, from foundations through advanced concepts.

## Binding design

20 modules: six foundations, seven intermediate, seven advanced. All levels ship together. Every taught concept maps to prose and a concept-specific narrated interactive scene. Each lesson supplies objectives, prerequisites, mental model, valid YAML and kubectl, expected outcomes, misconceptions, failure cases, prediction questions with explanations, local practice and primary sources. Three cumulative capstones cover stateless operations, stateful recovery, and GitOps plus an operator.

Astro static HTML, MDX, strict TypeScript, React islands, Motion transitions, semantic HTML/SVG scenes, Shiki and Pagefind. Editorial framed sheet, self-hosted IBM Plex Sans/Mono, Kubernetes blue, responsive light/dark/system themes. Play/pause/step/back/reset/speed/timeline, deterministic state, on-demand motion, offscreen pause, reduced-motion, keyboard and touch, static and textual equivalents.

Routes: /curriculum/, /learn/<level>/<lesson>/, /concepts/, /labs/, /about/. Stable content IDs. Local progress/bookmarks/export/import. No account/backend/AI/hosted cluster. kind labs with pinned images, diagnostics, expected results, cleanup and disposable recovery clusters. Cloudflare Workers Static Assets free hosting, no script/SSR/storage bindings; free workers.dev hostname and Git previews. Account connection needed only for deployment. Future licensing/public source release remains user decision.

## Tasks

1. Content contracts, curriculum inventory, foundation and dependency setup.
2. Polished Deployment/reconciliation reference lesson and responsive shell.
3. Scene families, search/reference, progress, bookmarks and sharing.
4. Six foundations modules and exercises.
5. Seven intermediate modules and exercises.
6. Seven advanced modules, exercises and three capstones.
7. Production verification, contribution documentation and hosting setup.

## Verification

Meaningful domain invariants, curriculum graph and scene coverage checks, manifest validation, representative journeys per level, progress corruption protection, keyboard/mobile/reduced-motion review. Production screenshots at 1440/768/390. Execute labs and record actual limitations. Lighthouse targets 90 performance/95 accessibility; initial lesson JS <=250 KB gzip. No trivial CSS/label tests or snapshot bloat. No complete claim until all levels meet the lesson contract and deployment is verified.
