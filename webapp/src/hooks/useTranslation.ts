'use client';

import { useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { getTranslation } from '@/i18n';

export function useTranslation() {
  const locale = useStore((state) => state.locale);
  const setLocale = useStore((state) => state.setLocale);

  const t = useCallback(
    (key: string): string => {
      return getTranslation(locale, key);
    },
    [locale]
  );

  return { t, locale, setLocale };
}
