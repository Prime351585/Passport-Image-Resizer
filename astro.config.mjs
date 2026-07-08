// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.resize-it.com',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'fr', 'es', 'hi', 'ja', 'zh', 'pt', 'it', 'ru', 'ar', 'ko', 'tr', 'id', 'vi'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    react(), 
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          de: 'de',
          fr: 'fr',
          es: 'es',
          hi: 'hi',
          ja: 'ja',
          zh: 'zh',
          pt: 'pt',
          it: 'it',
          ru: 'ru',
          ar: 'ar',
          ko: 'ko',
          tr: 'tr',
          id: 'id',
          vi: 'vi',
        }
      }
    })
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: true
  }
});