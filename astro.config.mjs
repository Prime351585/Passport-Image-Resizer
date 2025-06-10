// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react'; // Make sure you have @astrojs/react installed and configured
import cloudflare from '@astrojs/cloudflare'; // Make sure you have @astrojs/cloudflare installed and configured
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
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
    plugins: [tailwindcss()],
  },
  server:{
    host:true
  }
});