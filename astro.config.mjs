import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://madebyleshy.com',
  output: 'static',
  integrations: [sitemap()],
});