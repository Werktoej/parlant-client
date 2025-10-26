import { useMemo } from 'react';
import translations from '../i18n/translations.json';

type Language = 'da' | 'en';
type TranslationKey = string;

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

type Translations = Record<Language, TranslationObject>;

/**
 * Hook for handling translations with interpolation support
 * @param language - The language code ('da' or 'en')
 * @returns Translation function and current language
 */
export const useTranslation = (language: Language = 'da') => {
  const t = useMemo(() => {
    const getNestedValue = (obj: TranslationObject, path: string): string => {
      const result = path.split('.').reduce<string | TranslationObject | undefined>(
        (current, key) => {
          if (current && typeof current === 'object') {
            return current[key];
          }
          return undefined;
        },
        obj
      );

      return typeof result === 'string' ? result : path;
    };

    return (key: TranslationKey, params?: Record<string, string | number>): string => {
      const typedTranslations = translations as Translations;
      const translation = getNestedValue(typedTranslations[language], key);

      if (!params) {
        return translation;
      }

      // Replace placeholders like {agentName} with actual values
      return Object.entries(params).reduce((text, [paramKey, paramValue]) => {
        return text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }, translation);
    };
  }, [language]);

  return { t, language };
};

export type { Language };
