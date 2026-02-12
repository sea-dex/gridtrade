import en from './locales/en.js';
import zh from './locales/zh.js';
import ja from './locales/ja.js';
import ko from './locales/ko.js';
import es from './locales/es.js';
import ru from './locales/ru.js';
import pt from './locales/pt.js';
import fr from './locales/fr.js';
import de from './locales/de.js';

export type Locale = 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'ru' | 'pt' | 'fr' | 'de';

export type TranslationKey = keyof typeof en;

const translations: Record<Locale, Record<string, string>> = {
  en,
  zh,
  ja,
  ko,
  es,
  ru,
  pt,
  fr,
  de,
};

export const supportedLocales: Locale[] = ['en', 'zh', 'ja', 'ko', 'es', 'ru', 'pt', 'fr', 'de'];

export const defaultLocale: Locale = 'en';

export const getTranslation = (locale: Locale, key: string): string => {
  const localeTranslations = translations[locale] || translations[defaultLocale];
  return localeTranslations[key] || translations[defaultLocale][key] || key;
};

export const t = (locale: Locale, key: string, params?: Record<string, string | number>): string => {
  let translation = getTranslation(locale, key);

  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
    });
  }

  return translation;
};

export const isValidLocale = (locale: string): locale is Locale => {
  return supportedLocales.includes(locale as Locale);
};

export const parseLocale = (acceptLanguage: string | undefined): Locale => {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, priority] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0].toLowerCase(),
        priority: priority ? parseFloat(priority) : 1,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  for (const lang of languages) {
    if (isValidLocale(lang.code)) {
      return lang.code;
    }
  }

  return defaultLocale;
};
