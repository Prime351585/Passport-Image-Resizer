// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react'; // Make sure you have @astrojs/react installed and configured
import cloudflare from '@astrojs/cloudflare'; // Make sure you have @astrojs/cloudflare installed and configured
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://www.resize-it.com', // Replace with your actual domain
  adapter: cloudflare({
    // Cloudflare Adapter specific configurations, such as:
    // imageService: 'passthrough', // If using Astro's image service
    // runtime: {
    //   mode: 'directory', // or 'worker'
    // },
  }),
  integrations: [react(), sitemap()],
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