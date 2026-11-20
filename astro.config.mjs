import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://k8s-visualized.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), react(), sitemap()],
  markdown: { shikiConfig: { themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' }, wrap: true } },
  vite: { build: { chunkSizeWarningLimit: 300 } },
});
