import { useEffect } from 'react';
import type { Language } from '../services/supabaseService.v2';

/**
 * Hook to apply language-specific theme to the document
 */
export const useLanguageTheme = (language: Language) => {
  useEffect(() => {
    // Apply data-language attribute to body for theme inheritance
    document.body.setAttribute('data-language', language);
    
    // Also apply to root element
    const root = document.documentElement;
    root.setAttribute('data-language', language);
    
    return () => {
      document.body.removeAttribute('data-language');
      root.removeAttribute('data-language');
    };
  }, [language]);
};

/**
 * Hook to get language-specific CSS classes
 */
export const useLanguageClasses = (language: Language) => {
  return {
    cardClass: language === 'japanese' ? 'jp-card' : 'cn-card',
    buttonClass: language === 'japanese' ? 'jp-btn-primary' : 'cn-btn-primary',
    progressClass: language === 'japanese' ? 'jp-progress' : 'cn-progress',
    floatCharClass: language === 'japanese' ? 'jp-float-char' : 'cn-float-char',
    bgClass: language === 'japanese' ? 'jp-floating-bg jp-pattern-bg' : 'cn-floating-bg cn-pattern-bg',
  };
};


