// src/utils/schemas.ts — Structured Data (JSON-LD) generators for SEO
// Generates WebApplication and HowTo schemas from i18n translation data.

import type { SupportedLanguage } from './i18n';

const SITE_URL = 'https://www.resize-it.com';

const ORGANIZATION = {
  '@type': 'Organization',
  'name': 'Resize-It',
  'url': SITE_URL,
  'logo': `${SITE_URL}/favicon.svg`,
  'sameAs': [
    'https://x.com/HarshMaurya1585',
    'https://github.com/Prime351585',
  ],
};

// ─── Organization + WebSite (emitted globally by Layout) ────────────────────

export function generateOrganizationSchema(): object {
  return { '@context': 'https://schema.org', ...ORGANIZATION };
}

export function generateWebsiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Resize-It',
    'url': SITE_URL,
    'publisher': ORGANIZATION,
  };
}

// ─── Article (blog posts) ─────────────────────────────────────────────────────

interface ArticleSchemaOptions {
  headline: string;
  description: string;
  url: string;
  /** ISO date (YYYY-MM-DD). Omitted when unknown. */
  datePublished?: string;
  dateModified?: string;
}

export function generateArticleSchema(options: ArticleSchemaOptions): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': options.headline,
    'description': options.description,
    'mainEntityOfPage': options.url,
    'inLanguage': 'en',
    'author': ORGANIZATION,
    'publisher': ORGANIZATION,
  };
  if (options.datePublished) schema.datePublished = options.datePublished;
  if (options.dateModified) schema.dateModified = options.dateModified;
  return schema;
}

// ─── WebApplication Schema ──────────────────────────────────────────────────────

interface WebAppSchemaOptions {
  name: string;           // h1 from i18n
  description: string;    // meta_description from i18n
  url: string;            // canonical URL
  lang: SupportedLanguage;
  applicationCategory?: string;
}

export function generateWebAppSchema(options: WebAppSchemaOptions): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': options.name,
    'url': options.url,
    'description': options.description,
    'applicationCategory': options.applicationCategory || 'MultimediaApplication',
    'operatingSystem': 'Any',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'browserRequirements': 'Requires JavaScript',
    'inLanguage': options.lang,
    'provider': {
      '@type': 'Organization',
      'name': 'Resize-It',
      'url': 'https://www.resize-it.com',
    },
  };
}

// ─── HowTo Schema ───────────────────────────────────────────────────────────────

interface HowToStep {
  name: string;
  text: string;
}

interface HowToSchemaOptions {
  title: string;            // how_to.title from i18n
  steps: HowToStep[];       // Extracted from how_to.step1_title/step1_text etc.
  url: string;              // canonical URL
  description?: string;
  totalTime?: string;       // ISO 8601 duration, default PT2M
  toolName?: string;
}

export function generateHowToSchema(options: HowToSchemaOptions): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': options.title,
    'description': options.description || options.title,
    'url': options.url,
    'totalTime': options.totalTime || 'PT2M',
    'tool': {
      '@type': 'HowToTool',
      'name': options.toolName || 'Resize-It Online Tool',
    },
    'step': options.steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'name': step.name,
      'text': step.text,
    })),
  };
}

// ─── Helper: Extract HowTo steps from i18n JSON ────────────────────────────────

interface I18nHowTo {
  title: string;
  step1_title: string;
  step1_text: string;
  step2_title: string;
  step2_text: string;
  step3_title: string;
  step3_text: string;
  step4_title: string;
  step4_text: string;
}

export function extractHowToSteps(howTo: I18nHowTo): HowToStep[] {
  return [
    { name: howTo.step1_title, text: howTo.step1_text },
    { name: howTo.step2_title, text: howTo.step2_text },
    { name: howTo.step3_title, text: howTo.step3_text },
    { name: howTo.step4_title, text: howTo.step4_text },
  ];
}

// ─── BreadcrumbList Schema ──────────────────────────────────────────────────────

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  const baseUrl = 'https://www.resize-it.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url.startsWith('/') ? `${baseUrl}${item.url}` : item.url,
    })),
  };
}

// ─── FAQPage Schema ─────────────────────────────────────────────────────────────

interface FaqItem {
  question: string;
  answer: string;
}

export function generateFaqSchema(faqs: FaqItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  };
}

// ─── Helper: Extract FAQ items from i18n JSON ───────────────────────────────────

interface I18nFaq {
  h2: string;
  q1: string; a1: string;
  q2: string; a2: string;
  q3?: string; a3?: string;
}

export function extractFaqItems(faq: I18nFaq): FaqItem[] {
  const items: FaqItem[] = [
    { question: faq.q1, answer: faq.a1 },
    { question: faq.q2, answer: faq.a2 },
  ];
  if (faq.q3 && faq.a3) {
    items.push({ question: faq.q3, answer: faq.a3 });
  }
  return items;
}
