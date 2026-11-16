import es from '../i18n/es.json';
import en from '../i18n/en.json';

export type Locale = 'es' | 'en';
export type TranslationKey = keyof typeof es;
export type TranslationParams = Record<string, string | number>;
export type TranslationDict = Record<TranslationKey, string>;

const EN: TranslationDict = en;
const DICTIONARIES: Record<Locale, TranslationDict> = { es, en: EN };

export const LOCALES: Locale[] = ['es', 'en'];
export const LOCALE_STORAGE_KEY = 'ch-locale';

let activeLocale: Locale = detectLocale();

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'es' || value === 'en';
}

export function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Ignorar.
  }

  if (typeof navigator !== 'undefined') {
    const language = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
    if (language.startsWith('en')) return 'en';
  }

  return 'es';
}

export function getActiveLocale(): Locale {
  return activeLocale;
}

export function setActiveLocale(locale: Locale): void {
  activeLocale = locale;
}

export function localeTag(locale: Locale = activeLocale): string {
  return locale === 'en' ? 'en-GB' : 'es-ES';
}

export function hasTranslation(key: string): key is TranslationKey {
  return key in DICTIONARIES.es;
}

export function translate(
  key: TranslationKey,
  params: TranslationParams = {},
  locale: Locale = activeLocale,
): string {
  const template = DICTIONARIES[locale][key] ?? DICTIONARIES.es[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? placeholder : String(value);
  });
}

export function translatePlural(
  baseKey: string,
  count: number,
  params: TranslationParams = {},
  locale: Locale = activeLocale,
): string {
  const key = `${baseKey}.${count === 1 ? 'one' : 'other'}` as TranslationKey;
  return translate(key, { ...params, count }, locale);
}

export function dictionaryKeys(locale: Locale): TranslationKey[] {
  return Object.keys(DICTIONARIES[locale]) as TranslationKey[];
}
