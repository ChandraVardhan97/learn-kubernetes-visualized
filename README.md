# Kubernetes, Visualized

An interactive visual textbook for building a practical, accurate mental model of Kubernetes, from containers through control-plane internals and platform operations.

[Open Kubernetes, Visualized](https://learn-k8s.chandubodduluri.com/)

## Run locally

Use Node **22.23.4 or newer supported LTS** (the exact baseline is in `.node-version`).

```bash
npm ci
npm run dev
```

Open the local URL printed by Astro. This checkout also contains an ignored project-local Node runtime under `.runtime/node_modules/.bin`; if your system Node is older:

```bash
export PATH="$PWD/.runtime/node_modules/.bin:$PATH"
export ASTRO_TELEMETRY_DISABLED=1
npm run dev
```

Search is indexed from the production build:

```bash
npm run check
npm test
npm run verify:labs
npm run build
npm run preview
```

## What is here

- 20 connected modules and three focused lessons per module.
- Foundations, intermediate operations, and advanced internals.
- Narrated, replayable concept scenes with failure scenarios and reduced-motion support.
- Browser-local completion/bookmarks and validated progress import/export.
- Downloadable local labs and three capstone investigations.
- Static HTML, MDX, React islands, SVG, Motion, Shiki, and Pagefind.

See [the content contract](docs/CONTENT-CONTRACT.md), [contribution guide](CONTRIBUTING.md), [local labs](docs/LABS.md), [deployment guide](docs/DEPLOYMENT.md), and [verification record](docs/VERIFICATION.md).

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run check` | Astro/TypeScript diagnostics plus curriculum/reference validation |
| `npm test` | Important domain invariants and progress import protections |
| `npm run build` | Static site plus Pagefind search index |
| `npm run test:e2e` | Representative production browser journeys; requires a running preview on port 4322 and Chrome |
| `npm run verify:labs` | Local exercise asset and manifest validation |
| `npm run audit:performance` | Mobile Lighthouse and initial JavaScript budget against the running preview |
| `npm run deploy` | Deploy the static build to your connected Cloudflare account |

## Publishing and rights

Cloudflare Workers Static Assets serves `learn-k8s.chandubodduluri.com` and builds from `main`. Build and learning functionality do not need an account. To host your own copy, sign in to Cloudflare and set `SITE_URL` to its public address for canonical links and sitemap generation.

Copyright 2026 Chandu B. The project’s original code, lessons, diagrams, and lab materials are licensed under the [Apache License 2.0](LICENSE). See [Third-party notices](THIRD-PARTY-NOTICES.md) for separately licensed material.

This independent resource is not affiliated with Kubernetes or CNCF. Educational models identify their material simplifications; local kind behavior does not establish production HA or cloud-provider guarantees.

The complete technical documentation audit is recorded in [docs/CONTENT-AUDIT.md](docs/CONTENT-AUDIT.md), with per-lesson findings and primary-source coverage for all three levels. Review is separate from runtime and production certification.

Website interaction coverage and the two hydration corrections are recorded in [docs/FUNCTIONALITY-AUDIT.md](docs/FUNCTIONALITY-AUDIT.md).
