import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const STORAGE_KEY = 'tdp_language';
const translations = {};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch {}
    const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
    return nav.startsWith('es') ? 'es' : 'en';
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, language); } catch {}
  }, [language]);

  const toggle = () => setLanguage(prev => prev === 'en' ? 'es' : 'en');

  const t = (key, fallback = '') => {
    const keys = key.split('.');
    let current = translations[language];
    for (const k of keys) {
      if (!current) return fallback;
      current = current[k];
    }
    return current || fallback;
  };

  return (
    <LanguageContext.Provider value={{ language, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
