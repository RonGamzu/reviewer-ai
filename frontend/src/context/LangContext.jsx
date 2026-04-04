import { createContext, useContext, useState, useEffect } from 'react';
import { rtlLocales } from '../i18n/index.js';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('reviewer_ai_locale') || 'en';
  });

  useEffect(() => {
    const dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    localStorage.setItem('reviewer_ai_locale', locale);
  }, [locale]);

  function toggleLocale() {
    setLocale(prev => prev === 'en' ? 'he' : 'en');
  }

  return (
    <LangContext.Provider value={{ locale, setLocale, toggleLocale, isRtl: rtlLocales.includes(locale) }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
