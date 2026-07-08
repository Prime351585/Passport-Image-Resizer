import { findToolBySlug, findPresetBySlug, getToolHreflangAlternates, getPresetHreflangAlternates } from './src/utils/i18n.ts';

console.log('crop', findToolBySlug('crop'));
console.log('recortar-imagen', findToolBySlug('recortar-imagen'));
console.log('miniatura-youtube', findPresetBySlug('miniatura-youtube'));
console.log('alts tool', getToolHreflangAlternates('crop'));
console.log('alts preset', getPresetHreflangAlternates('crop', 'youtube-thumbnail'));
