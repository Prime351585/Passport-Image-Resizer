// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react'; // Make sure you have @astrojs/react installed and configured
import cloudflare from '@astrojs/cloudflare'; // Make sure you have @astrojs/cloudflare installed and configured

export default defineConfig({
  output: 'static', // or 'hybrid', to enable SSR
  adapter: cloudflare({
    // Cloudflare Adapter specific configurations, such as:
    // imageService: 'passthrough', // If using Astro's image service
    // runtime: {
    //   mode: 'directory', // or 'worker'
    // },
  }),
  integrations: [react()],
  vite: {
    resolve: {
      alias: import.meta.env.PROD && {
        "react-dom/server": "react-dom/server.edge",
      },
    },
    // Optional: Further optimize Cloudflare packaging behavior
    // ssr: {
    //   // Cloudflare Workers typically need all dependencies bundled into a single file
    //   // external: [], // Explicitly tell Vite not to treat any dependencies as external
    //   // noExternal: [/.*/], // Force inline all dependencies
    //   resolve: {
    //      // Ensure 'workerd' or 'worker' conditions take priority, helping Vite select the correct package versions
    //     conditions: ['workerd', 'worker', 'browser'],
    //   },
    // },
  },
});