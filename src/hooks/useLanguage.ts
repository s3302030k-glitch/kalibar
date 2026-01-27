import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { detectCountryByIP } from '@/i18n';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Failsafe timeout: unblock page after 2 seconds no matter what
    const timeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('Language detection timed out - using default');
        setIsLoading(false);
      }
    }, 2000);

    const initLanguage = async () => {
      try {
        // Check if language is already saved in localStorage
        const savedLanguage = localStorage.getItem('i18nextLng');

        if (!savedLanguage) {
          // Only auto-detect if no language preference is saved
          const detectedLang = await detectCountryByIP();
          if (isMounted) {
            await i18n.changeLanguage(detectedLang);
          }
        }
      } catch (err) {
        console.warn('Language init error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initLanguage();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [i18n]);

  useEffect(() => {
    // Update document direction and language based on current language
    const dir = i18n.language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(newLang);
  };

  const setLanguage = (lang: 'en' | 'fa') => {
    i18n.changeLanguage(lang);
  };

  return {
    currentLanguage: i18n.language as 'en' | 'fa',
    isRTL: i18n.language === 'fa',
    isLoading,
    toggleLanguage,
    setLanguage,
  };
};
