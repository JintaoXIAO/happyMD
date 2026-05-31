import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

type LocaleMessages = typeof zhCN;
type LocaleKey = keyof LocaleMessages;

const locales: Record<string, LocaleMessages> = {
  'zh-CN': zhCN,
  'zh': zhCN,
  'en': en,
};

function detectLocale(): string {
  const lang = navigator.language;
  // Exact match first
  if (locales[lang]) return lang;
  // Try base language (e.g., 'zh-TW' -> 'zh')
  const base = lang.split('-')[0];
  if (locales[base]) return base;
  // Default to English
  return 'en';
}

const currentLocale = detectLocale();
const messages = locales[currentLocale] || en;

/**
 * Translate a key to the current locale string.
 * Supports simple interpolation: t('key', { name: 'value' }) replaces {name} in the string.
 */
export function t(key: LocaleKey, params?: Record<string, string | number>): string {
  let text = messages[key] || en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function getCurrentLocale(): string {
  return currentLocale;
}
