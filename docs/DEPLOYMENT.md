# Cloudflare deployment

This is an Astro **static** site. No Worker script, SSR, R2, KV, D1, or paid service is required.

## First deployment

1. Create/sign in to a free Cloudflare account. Cloudflare advertises no credit card requirement for Workers free signup.
2. Use the Node version in `.node-version`, then run `npm ci`, `npm run check`, `npm test`, `npm run verify:labs`, and `npm run build`.
3. Run `npx wrangler login` yourself to connect the intended account. No credentials should be pasted into source or chat.
4. Set the desired unique Worker name in `wrangler.jsonc`. The initial name is `kubernetes-visualized`.
5. Set `SITE_URL` to the public address of your installation, rebuild with `npm run build`, and deploy with `npm run deploy`. The canonical links and sitemap will use that address.
6. Verify homepage, a lesson in each level, search, scene links, progress, downloads, and a nonexistent route returning the custom 404.

`assets.directory` points at `dist`; `not_found_handling` is `404-page`. Keep `main` and `run_worker_first` absent so ordinary requests remain static asset requests.

## Git integration and previews

Both Cloudflare projects track `main` from the same GitHub repository and use `npm run build`. Pages publishes `dist`. Workers Builds deploys with `npx wrangler deploy` and uses its preview build settings for other branches. Enable branch previews in each project as needed.

Use the Node version in `.node-version` and the same canonical `SITE_URL` in both build environments.

For an existing Worker created from a dashboard template, connect GitHub and merge a pull request into the configured production branch. The merge triggers the first repository build for that Worker. Check **Deployments → View build history** for the build and confirm the commit is active. The canonical public address is `https://k8s-visualized.pages.dev`.

Keep the build checks in the repository’s CI. Preview builds should exercise the same static output; do not introduce an adapter or API just for deployment.

## Verified platform boundaries

As researched for this project: static asset requests are free and unlimited, Free has 20,000 files and 25 MiB/file, and Workers Builds includes 3,000 minutes/month. Plan limits can change; verify official pages before changing infrastructure.

- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
- https://www.cloudflare.com/products/workers/

The generated `dist/` directory can be served by another static host later. No host-specific runtime behavior is required.
