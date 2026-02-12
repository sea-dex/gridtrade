import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import es from './locales/es.json';
import ru from './locales/ru.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

export const locales = {
  en,
  zh,
  ja,
  ko,
  es,
  ru,
  pt,
  fr,
  de,
} as const;

export type Locale = keyof typeof locales;

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  ru: 'Русский',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
};

export const defaultLocale: Locale = 'en';

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: unknown = locales[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English
      value = locales.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = (value as Record<string, unknown>)[fallbackKey];
        } else {
          return key;
        }
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}
