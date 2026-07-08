// src/utils/i18n.ts — Core i18n infrastructure for Resize-It
// Handles language constants, slug mappings, translation loading, and SEO tag generation.

// ─── Supported Languages ───────────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES = [
  'en', 'de', 'fr', 'es', 'hi', 'ja', 'zh', 'pt', 'it', 'ru',
  'ar', 'ko', 'tr', 'id', 'vi'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  hi: 'हिन्दी',
  ja: '日本語',
  zh: '中文',
  pt: 'Português',
  it: 'Italiano',
  ru: 'Русский',
  ar: 'العربية',
  ko: '한국어',
  tr: 'Türkçe',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt',
};

// HTML lang attribute values (BCP 47)
export const LANG_CODES: Record<SupportedLanguage, string> = {
  en: 'en', de: 'de', fr: 'fr', es: 'es', hi: 'hi',
  ja: 'ja', zh: 'zh-Hans', pt: 'pt', it: 'it', ru: 'ru',
  ar: 'ar', ko: 'ko', tr: 'tr', id: 'id', vi: 'vi',
};

// RTL languages
export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// ─── Tool Identifiers ──────────────────────────────────────────────────────────
export const TOOLS = [
  'resize', 'crop', 'compress',
  'jpeg-to-png', 'jpeg-to-webp', 'png-to-webp',
  'webp-to-jpeg', 'webp-to-png',
  'compress-pdf', 'merge-pdf'
] as const;

export type ToolId = typeof TOOLS[number];

// ─── Localized Slug Mappings ────────────────────────────────────────────────────
// For Latin-script languages we use native slugs; for non-Latin scripts we fall
// back to English slugs (Cyrillic/Arabic/CJK URLs get percent-encoded and hurt UX).

export const TOOL_SLUGS: Record<ToolId, Partial<Record<SupportedLanguage, string>>> = {
  'resize': {
    en: 'resize', de: 'bildgroesse-aendern', fr: 'redimensionner', es: 'redimensionar-imagen',
    pt: 'redimensionar-imagem', it: 'ridimensiona-immagine', tr: 'resim-boyutlandir',
    id: 'ubah-ukuran-gambar', vi: 'thay-doi-kich-thuoc',
  },
  'crop': {
    en: 'crop', de: 'bild-zuschneiden', fr: 'recadrer-image', es: 'recortar-imagen',
    pt: 'cortar-imagem', it: 'ritaglia-immagine', tr: 'resim-kirp',
    id: 'potong-gambar', vi: 'cat-anh',
  },
  'compress': {
    en: 'compress', de: 'bild-komprimieren', fr: 'compresser-image', es: 'comprimir-imagen',
    pt: 'comprimir-imagem', it: 'comprimi-immagine', tr: 'resim-sikistir',
    id: 'kompres-gambar', vi: 'nen-anh',
  },
  'jpeg-to-png': {
    en: 'jpeg-to-png', de: 'jpeg-zu-png', fr: 'jpeg-en-png', es: 'jpeg-a-png',
    pt: 'jpeg-para-png', it: 'jpeg-a-png', tr: 'jpeg-den-png',
    id: 'jpeg-ke-png', vi: 'jpeg-sang-png',
  },
  'jpeg-to-webp': {
    en: 'jpeg-to-webp', de: 'jpeg-zu-webp', fr: 'jpeg-en-webp', es: 'jpeg-a-webp',
    pt: 'jpeg-para-webp', it: 'jpeg-a-webp', tr: 'jpeg-den-webp',
    id: 'jpeg-ke-webp', vi: 'jpeg-sang-webp',
  },
  'png-to-webp': {
    en: 'png-to-webp', de: 'png-zu-webp', fr: 'png-en-webp', es: 'png-a-webp',
    pt: 'png-para-webp', it: 'png-a-webp', tr: 'png-den-webp',
    id: 'png-ke-webp', vi: 'png-sang-webp',
  },
  'webp-to-jpeg': {
    en: 'webp-to-jpeg', de: 'webp-zu-jpeg', fr: 'webp-en-jpeg', es: 'webp-a-jpeg',
    pt: 'webp-para-jpeg', it: 'webp-a-jpeg', tr: 'webp-den-jpeg',
    id: 'webp-ke-jpeg', vi: 'webp-sang-jpeg',
  },
  'webp-to-png': {
    en: 'webp-to-png', de: 'webp-zu-png', fr: 'webp-en-png', es: 'webp-a-png',
    pt: 'webp-para-png', it: 'webp-a-png', tr: 'webp-den-png',
    id: 'webp-ke-png', vi: 'webp-sang-png',
  },
  'compress-pdf': {
    en: 'compress-pdf', de: 'pdf-komprimieren', fr: 'compresser-pdf', es: 'comprimir-pdf',
    pt: 'comprimir-pdf', it: 'comprimi-pdf', tr: 'pdf-sikistir',
    id: 'kompres-pdf', vi: 'nen-pdf',
  },
  'merge-pdf': {
    en: 'merge-pdf', de: 'pdf-zusammenfuegen', fr: 'fusionner-pdf', es: 'unir-pdf',
    pt: 'unir-pdf', it: 'unisci-pdf', tr: 'pdf-birlestir',
    id: 'gabung-pdf', vi: 'gop-pdf',
  },
};

// ─── Preset Identifiers & Slugs ─────────────────────────────────────────────────
export const RESIZE_PRESETS = [
  'youtube-thumbnail', 'instagram-post', 'facebook-cover', 'pinterest-pin'
] as const;

export const CROP_PRESETS = [
  'youtube-thumbnail', 'instagram-post', 'facebook-cover', 'pinterest-pin'
] as const;

export type PresetId = typeof RESIZE_PRESETS[number];

export const PRESET_SLUGS: Record<PresetId, Partial<Record<SupportedLanguage, string>>> = {
  'youtube-thumbnail': {
    en: 'youtube-thumbnail', de: 'youtube-vorschaubild', fr: 'miniature-youtube',
    es: 'miniatura-youtube', pt: 'miniatura-youtube', it: 'miniatura-youtube',
    tr: 'youtube-kucuk-resim', id: 'thumbnail-youtube', vi: 'anh-nho-youtube',
  },
  'instagram-post': {
    en: 'instagram-post', de: 'instagram-beitrag', fr: 'publication-instagram',
    es: 'publicacion-instagram', pt: 'postagem-instagram', it: 'post-instagram',
    tr: 'instagram-gonderi', id: 'postingan-instagram', vi: 'bai-dang-instagram',
  },
  'facebook-cover': {
    en: 'facebook-cover', de: 'facebook-titelbild', fr: 'couverture-facebook',
    es: 'portada-facebook', pt: 'capa-facebook', it: 'copertina-facebook',
    tr: 'facebook-kapak', id: 'sampul-facebook', vi: 'anh-bia-facebook',
  },
  'pinterest-pin': {
    en: 'pinterest-pin', de: 'pinterest-pin', fr: 'epingle-pinterest',
    es: 'pin-pinterest', pt: 'pin-pinterest', it: 'pin-pinterest',
    tr: 'pinterest-pin', id: 'pin-pinterest', vi: 'ghim-pinterest',
  },
};

// ─── Slug Resolution Helpers ────────────────────────────────────────────────────

/** Get the localized slug for a tool in a given language (falls back to English) */
export function getToolSlug(toolId: ToolId, lang: SupportedLanguage): string {
  return TOOL_SLUGS[toolId]?.[lang] || TOOL_SLUGS[toolId]?.['en'] || toolId;
}

/** Get the localized slug for a preset in a given language (falls back to English) */
export function getPresetSlug(presetId: PresetId, lang: SupportedLanguage): string {
  return PRESET_SLUGS[presetId]?.[lang] || PRESET_SLUGS[presetId]?.['en'] || presetId;
}

/** Reverse lookup: given a slug, find the tool ID */
export function findToolBySlug(slug: string): ToolId | undefined {
  for (const toolId of TOOLS) {
    const slugMap = TOOL_SLUGS[toolId];
    if (!slugMap) continue;
    for (const langSlug of Object.values(slugMap)) {
      if (langSlug === slug) return toolId;
    }
  }
  return undefined;
}

/** Reverse lookup: given a slug, find the preset ID */
export function findPresetBySlug(slug: string): PresetId | undefined {
  for (const presetId of RESIZE_PRESETS) {
    const slugMap = PRESET_SLUGS[presetId];
    if (!slugMap) continue;
    for (const langSlug of Object.values(slugMap)) {
      if (langSlug === slug) return presetId;
    }
  }
  return undefined;
}

// ─── URL / Path Builders ────────────────────────────────────────────────────────

const SITE_URL = 'https://www.resize-it.com';

/** Build the full URL for a tool page in a given language */
export function getToolUrl(toolId: ToolId, lang: SupportedLanguage): string {
  const slug = getToolSlug(toolId, lang);
  if (lang === DEFAULT_LANGUAGE) return `${SITE_URL}/${slug}`;
  return `${SITE_URL}/${lang}/${slug}`;
}

/** Build the full URL for a preset page in a given language */
export function getPresetUrl(parentTool: 'resize' | 'crop', presetId: PresetId, lang: SupportedLanguage): string {
  const toolSlug = getToolSlug(parentTool as ToolId, lang);
  const presetSlug = getPresetSlug(presetId, lang);
  if (lang === DEFAULT_LANGUAGE) return `${SITE_URL}/${toolSlug}/${presetSlug}`;
  return `${SITE_URL}/${lang}/${toolSlug}/${presetSlug}`;
}

/** Build the full URL for a passport country page */
export function getPassportUrl(countrySlug: string, lang?: SupportedLanguage): string {
  if (!lang || lang === DEFAULT_LANGUAGE) return `${SITE_URL}/passport/${countrySlug}`;
  return `${SITE_URL}/${lang}/passport/${countrySlug}`;
}

// ─── Hreflang Tag Generation ────────────────────────────────────────────────────

export interface HreflangAlternate {
  lang: string;   // BCP 47 code
  href: string;    // Full absolute URL
}

/** Generate hreflang alternates for a tool page */
export function getToolHreflangAlternates(toolId: ToolId): HreflangAlternate[] {
  const alternates: HreflangAlternate[] = [];

  for (const lang of SUPPORTED_LANGUAGES) {
    alternates.push({
      lang: LANG_CODES[lang],
      href: getToolUrl(toolId, lang),
    });
  }

  // x-default points to English
  alternates.push({
    lang: 'x-default',
    href: getToolUrl(toolId, 'en'),
  });

  return alternates;
}

/** Generate hreflang alternates for a preset page */
export function getPresetHreflangAlternates(parentTool: 'resize' | 'crop', presetId: PresetId): HreflangAlternate[] {
  const alternates: HreflangAlternate[] = [];

  for (const lang of SUPPORTED_LANGUAGES) {
    alternates.push({
      lang: LANG_CODES[lang],
      href: getPresetUrl(parentTool, presetId, lang),
    });
  }

  alternates.push({
    lang: 'x-default',
    href: getPresetUrl(parentTool, presetId, 'en'),
  });

  return alternates;
}

/** Generate hreflang alternates for a passport country page (single language) */
export function getPassportHreflangAlternates(countrySlug: string): HreflangAlternate[] {
  return [
    { lang: 'x-default', href: getPassportUrl(countrySlug) },
  ];
}

// ─── Tool ↔ React Component Mapping ─────────────────────────────────────────────
// Maps tool IDs to the React component name that powers the interactive tool.

export const TOOL_COMPONENT_MAP: Record<ToolId, string> = {
  'resize': 'ImageToolContainer',
  'crop': 'CropToolContainer',
  'compress': 'CompressToolContainer',
  'jpeg-to-png': 'ConvertToolContainer',
  'jpeg-to-webp': 'ConvertToolContainer',
  'png-to-webp': 'ConvertToolContainer',
  'webp-to-jpeg': 'ConvertToolContainer',
  'webp-to-png': 'ConvertToolContainer',
  'compress-pdf': 'PDFCompressToolContainer',
  'merge-pdf': 'PDFMergeToolContainer',
};

// Conversion tool needs to know source/target formats
export const CONVERT_FORMATS: Partial<Record<ToolId, { from: string; to: string }>> = {
  'jpeg-to-png': { from: 'JPEG', to: 'PNG' },
  'jpeg-to-webp': { from: 'JPEG', to: 'WebP' },
  'png-to-webp': { from: 'PNG', to: 'WebP' },
  'webp-to-jpeg': { from: 'WebP', to: 'JPEG' },
  'webp-to-png': { from: 'WebP', to: 'PNG' },
};
