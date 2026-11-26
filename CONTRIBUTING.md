# Contributing

Use GitHub Issues to share corrections and suggestions. The project’s original materials are licensed under the [Apache License 2.0](LICENSE). These guidelines describe how to prepare and verify a proposed change.

## Improve one idea at a time

Start with a specific learning problem: a misconception, an inaccurate transition, a missing failure case, an inaccessible control, or a lab that fails on the pinned environment. Describe the observed result, expected result, environment and primary source.

Read `docs/CONTENT-CONTRACT.md` before adding content. Prose lives in MDX, scene definitions in JSON, and detailed traces in `src/data/event-traces.ts`. Renderers and stateful UI live in components. Keep the smallest meaningful change in one contribution.

## Content review

- Explain the responsible component, state transition, ownership boundary and operational consequence.
- Keep documented upstream behavior distinct from a specific CNI/CSI/provider implementation.
- Link primary documentation and record reviewed Kubernetes/tool versions.
- Teach every declared concept with substantive explanation and a relevant scene.
- Include a prediction question, explained answer, failure case and practical exercise.
- Never invent metrics, successful lab execution or universal production behavior.

## Visual review

Use the established tokens, type, node grammar and scene controls. Keep visible labels, keyboard access and a textual equivalent. Verify 1440px, 768px and 390px, plus dark and reduced-motion modes. Prefer a purposeful explanation over decorative animation.

## Verification

Run `npm run check`, `npm test`, `npm run verify:labs` and `npm run build`. Run relevant browser journeys against the production preview when interaction changes. Test meaningful behavior; avoid snapshots or tests that merely repeat labels, CSS declarations or implementation details.

For lab changes, edit the exercise data under src/data and keep manifests and helpers under public/labs. Regenerate the guides and ZIP with npm run build:lab-downloads. Run the published steps on a disposable cluster with bash scripts/run-labs.sh <exercise-id>, then record the outcome and cleanup in docs/labs-report.md. See [the lab authoring and verification guide](docs/LABS.md). Keep credentials and user kubeconfig out of the repository.

## Reviewable contributions

Explain the learning problem, resulting behavior, primary sources and verification. Include a screenshot or short recording when the visible explanation changes. Preserve stable lesson/concept IDs; if a route moves, provide a redirect and maintain progress compatibility.
