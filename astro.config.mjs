import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://madebyleshy.com',
  output: 'static',
  integrations: [sitemap(), react()],
  vite: {
    optimizeDeps: {
      include: ['tone'],
    },
  },
});