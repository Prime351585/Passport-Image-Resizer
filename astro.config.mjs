import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { findToolBySlug, findPresetBySlug, getToolHreflangAlternates, getPresetHreflangAlternates } from './src/utils/i18n.ts';

export default defineConfig({
  site: 'https://www.resize-it.com',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
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
          vi: 'vi'
        }
      }, // <-- FIXED: Properly closed the locales and i18n objects here
      xslURL: '/sitemap.xsl',
      serialize(item) {
        // Strip trailing slash and prefix domain
        const urlObj = new URL(item.url);
        const path = urlObj.pathname.replace(/^\/|\/$/g, '');
        const segments = path.split('/');
        
        // FIXED: Added homepage hreflang mapping before returning
        if (!path || path === '') {
           item.links = [
             { lang: 'en', url: 'https://www.resize-it.com/' },
             { lang: 'de', url: 'https://www.resize-it.com/de/' },
             { lang: 'fr', url: 'https://www.resize-it.com/fr/' },
             { lang: 'es', url: 'https://www.resize-it.com/es/' },
             { lang: 'hi', url: 'https://www.resize-it.com/hi/' },
             { lang: 'ja', url: 'https://www.resize-it.com/ja/' },
             { lang: 'zh', url: 'https://www.resize-it.com/zh/' },
             { lang: 'pt', url: 'https://www.resize-it.com/pt/' },
             { lang: 'it', url: 'https://www.resize-it.com/it/' },
             { lang: 'ru', url: 'https://www.resize-it.com/ru/' },
             { lang: 'ar', url: 'https://www.resize-it.com/ar/' },
             { lang: 'ko', url: 'https://www.resize-it.com/ko/' },
             { lang: 'tr', url: 'https://www.resize-it.com/tr/' },
             { lang: 'id', url: 'https://www.resize-it.com/id/' },
             { lang: 'vi', url: 'https://www.resize-it.com/vi/' },
             { lang: 'x-default', url: 'https://www.resize-it.com/' }
           ];
           return item; 
        }
        
        let toolSlug = '';
        let presetSlug = '';
        let isPassport = false;
        let passportSlug = '';
        
        // Very basic path routing analysis
        if (segments.length === 1) {
          toolSlug = segments[0];
          if (toolSlug === 'passport') return item;
        } else if (segments.length === 2) {
          if (['de','fr','es','hi','ja','zh','pt','it','ru','ar','ko','tr','id','vi'].includes(segments[0])) {
            if (segments[1] === 'passport') return item;
            toolSlug = segments[1];
          } else {
            if (segments[0] === 'passport') {
              isPassport = true;
              passportSlug = segments[1];
            } else {
              toolSlug = segments[0];
              presetSlug = segments[1];
            }
          }
        } else if (segments.length === 3) {
          if (['de','fr','es','hi','ja','zh','pt','it','ru','ar','ko','tr','id','vi'].includes(segments[0])) {
            if (segments[1] === 'passport') {
              isPassport = true;
              passportSlug = segments[2];
            } else {
              toolSlug = segments[1];
              presetSlug = segments[2];
            }
          }
        }

        let newLinks = item.links || [];

        if (isPassport && passportSlug) {
           newLinks = [
             { lang: 'x-default', url: `https://www.resize-it.com/passport/${passportSlug}` }
           ];
           return { url: item.url, links: newLinks };
        }

        const toolId = findToolBySlug(toolSlug);
        
        if (toolId && presetSlug) {
           const presetId = findPresetBySlug(presetSlug);
           if (presetId) {
             const alts = getPresetHreflangAlternates(toolId, presetId);
             newLinks = alts.map(a => ({ lang: a.lang, url: a.href }));
           }
        } else if (toolId) {
           const alts = getToolHreflangAlternates(toolId);
           newLinks = alts.map(a => ({ lang: a.lang, url: a.href }));
        }

        // Return a strictly formatted object
        return { 
          url: item.url, 
          links: newLinks 
        };
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