import { Injectable, computed, effect, signal } from '@angular/core';
import {
  LOCALE_STORAGE_KEY,
  detectLocale,
  isLocale,
  setActiveLocale,
  translate,
  translatePlural,
  type Locale,
  type TranslationKey,
  type TranslationParams,
} from './i18n';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>(detectLocale());
  readonly isEnglish = computed(() => this.locale() === 'en');
  readonly switchLabel = computed(() =>
    translate(
      this.isEnglish() ? 'language.switchToSpanish' : 'language.switchToEnglish',
      {},
      this.locale(),
    ),
  );

  constructor() {
    this.apply(this.locale());
    effect(() => this.apply(this.locale()));
  }

  set(locale: Locale): void {
    if (locale === this.locale()) return;
    this.locale.set(locale);
  }

  toggle(): void {
    this.locale.update((locale) => (locale === 'es' ? 'en' : 'es'));
  }

  t(key: TranslationKey, params?: TranslationParams): string {
    return translate(key, params, this.locale());
  }

  plural(baseKey: string, count: number, params?: TranslationParams): string {
    return translatePlural(baseKey, count, params, this.locale());
  }

  private apply(locale: Locale): void {
    setActiveLocale(locale);

    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (!isLocale(stored) || stored !== locale) {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      }
    } catch {
      // Ignorar.
    }

    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.title = translate('meta.title', {}, locale);
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', translate('meta.description', {}, locale));
  }
}
