# Cloudflare deployment

This is an Astro **static** site. No Worker script, SSR, R2, KV, D1, or paid service is required.

## First deployment

1. Create/sign in to a free Cloudflare account. Cloudflare advertises no credit card requirement for Workers free signup.
2. Use the Node version in `.node-version`, then run `npm ci`, `npm run check`, `npm test`, `npm run verify:labs`, and `npm run build`.
3. Run `npx wrangler login` yourself to connect the intended account. No credentials should be pasted into source or chat.
4. Set the desired unique Worker name in `wrangler.jsonc`. The initial name is `kubernetes-visualized`.
5. Deploy once with `npm run deploy`. Use the returned actual `https://<name>.<account-subdomain>.workers.dev` URL as `SITE_URL`, rebuild, and redeploy so canonical links and sitemap are correct.
6. Verify homepage, a lesson in each level, search, scene links, progress, downloads, and a nonexistent route returning the custom 404.

`assets.directory` points at `dist`; `not_found_handling` is `404-page`. Keep `main` and `run_worker_first` absent so ordinary requests remain static asset requests.

## Git integration and previews

Connect the chosen source repository under Workers & Pages → project → Builds. Use the repository’s supported Node runtime, `npm run build`, and `npx wrangler deploy` for production. Set `SITE_URL` to the production hostname. Enable non-production branch previews through Cloudflare’s preview configuration. Repository publication/visibility is a separate owner decision.

Keep the build checks in the repository’s CI. Preview builds should exercise the same static output; do not introduce an adapter or API just for deployment.

## Verified platform boundaries

As researched for this project: static asset requests are free and unlimited, Free has 20,000 files and 25 MiB/file, and Workers Builds includes 3,000 minutes/month. Plan limits can change; verify official pages before changing infrastructure.

- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
- https://www.cloudflare.com/products/workers/

The generated `dist/` directory can be served by another static host later. No host-specific runtime behavior is required.
