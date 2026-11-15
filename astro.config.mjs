import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { findToolBySlug, findPresetBySlug, getToolHreflangAlternates, getPresetHreflangAlternates, getUntranslatedUrls } from './src/utils/i18n.ts';

// Localized URLs that only repeat English content: they canonicalize to the
// English page, so they stay out of the sitemap.
const UNTRANSLATED = getUntranslatedUrls();

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
      filter: (page) => !UNTRANSLATED.has(page.replace(/\/$/, '')),
      serialize(item) {
        // Strip trailing slash and prefix domain
        const urlObj = new URL(item.url);
        const path = urlObj.pathname.replace(/^\/|\/$/g, '');
        const segments = path.split('/');
        
        // Strip trailing slash for the main URL too (except root)
        const cleanUrl = urlObj.pathname === '/' ? item.url : item.url.replace(/\/$/, '');

        // FIXED: Added homepage hreflang mapping before returning
        // Homepage: English only (there are no /de, /fr ... homepages).
        if (!path || path === '') {
           return { url: 'https://www.resize-it.com/', links: [] };
        }
        
        let toolSlug = '';
        let presetSlug = '';
        let isPassport = false;
        let passportSlug = '';
        
        // Very basic path routing analysis
        if (segments.length === 1) {
          toolSlug = segments[0];
          if (toolSlug === 'passport') return { url: cleanUrl, links: item.links || [] };
        } else if (segments.length === 2) {
          if (['de','fr','es','hi','ja','zh','pt','it','ru','ar','ko','tr','id','vi'].includes(segments[0])) {
            if (segments[1] === 'passport') return { url: cleanUrl, links: item.links || [] };
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
           return { url: cleanUrl, links: newLinks };
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
          url: cleanUrl, 
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