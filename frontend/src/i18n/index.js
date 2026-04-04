import en from './en.js';
import he from './he.js';

export const dictionaries = { en, he };
export const supportedLocales = ['en', 'he'];
export const rtlLocales = ['he'];

export function t(locale, key) {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict[key] ?? dictionaries.en[key] ?? key;
}
