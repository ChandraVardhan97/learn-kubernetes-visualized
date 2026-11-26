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

## Production custom domain

The `kubernetes-visualized` Worker serves [learn-k8s.chandubodduluri.com](https://learn-k8s.chandubodduluri.com/).

1. Open **Workers & Pages → kubernetes-visualized → Settings → Domains & Routes → Add → Custom Domain** and enter `learn-k8s.chandubodduluri.com`. Cloudflare creates the DNS record and issues the certificate for the `.com` zone. [Cloudflare Workers custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
2. Set any existing production `SITE_URL` build variable to `https://learn-k8s.chandubodduluri.com` before rebuilding. A build without an override uses the repository default.
3. Verify the custom hostname serves the homepage, deep links, search, lab downloads, and custom 404 over HTTPS. Check that the generated canonical links and sitemap use the custom hostname.

## Git integration and previews

Workers Builds tracks `main` from the GitHub repository, builds with `npm run build`, and deploys with `npx wrangler deploy`. Enable Worker preview builds for other branches as needed.

Use the Node version in `.node-version`. If the legacy Pages project still builds, use the same canonical `SITE_URL` there. After verifying the Worker deployment on the custom domain, disable Pages automatic deployments or retire the Pages project. Deleting Pages takes `k8s-visualized.pages.dev` and its Pages previews offline. [Cloudflare migration guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)

For an existing Worker created from a dashboard template, connect GitHub and merge a pull request into the configured production branch. The merge triggers the first repository build for that Worker. Check **Deployments → View build history** for the build and confirm the commit is active.

Keep the build checks in the repository’s CI. Preview builds should exercise the same static output; do not introduce an adapter or API just for deployment.

For changes to the lab bundle or setup flow, complete the [Windows and macOS release check](LABS.md#release-check-for-the-shared-zip) before merging into the branch that deploys to production.

## Verified platform boundaries

As researched for this project: static asset requests are free and unlimited, Free has 20,000 files and 25 MiB/file, and Workers Builds includes 3,000 minutes/month. Plan limits can change; verify official pages before changing infrastructure.

- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
- https://www.cloudflare.com/products/workers/

The generated `dist/` directory can be served by another static host later. No host-specific runtime behavior is required.
