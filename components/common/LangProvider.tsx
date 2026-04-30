// ============================================================================
// Language Provider — client-side locale switching
// ============================================================================

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/translations';
import { translations } from '@/lib/i18n/translations';

interface LangContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Restore from localStorage if available
    const saved = localStorage.getItem('cha-locale');
    if (saved === 'en' || saved === 'id') {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('cha-locale', newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[locale][key] || translations.en[key] || key;
  };

  return (
    <LangContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}

export function LangToggle() {
  const { locale, setLocale } = useLang();

  return (
    <div className="flex items-center rounded-full border-[1.5px] border-navy bg-transparent p-0.5 text-xs font-bold">
      <button
        onClick={() => setLocale('en')}
        className={`rounded-full px-2.5 py-1 tracking-wider transition-all ${
          locale === 'en' ? 'bg-navy text-cream' : 'text-navy'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('id')}
        className={`rounded-full px-2.5 py-1 tracking-wider transition-all ${
          locale === 'id' ? 'bg-navy text-cream' : 'text-navy'
        }`}
      >
        ID
      </button>
    </div>
  );
}
