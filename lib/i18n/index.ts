'use client'

import { useCallback, useMemo } from 'react'
import type { Language, Translations, TranslationMap } from './types'
import { en } from './translations/en'
import { hi } from './translations/hi'
import { ta } from './translations/ta'
import { te } from './translations/te'
import { bn } from './translations/bn'
import { es } from './translations/es'
import { fr } from './translations/fr'
import { ar } from './translations/ar'
import { de } from './translations/de'
import { ja } from './translations/ja'
import { zh } from './translations/zh'
import { ko } from './translations/ko'

export type { Language, Translations, TranslationMap }

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', dir: 'ltr' },
]

const translationMap: TranslationMap = {
  en,
  hi,
  ta,
  te,
  bn,
  es,
  fr,
  ar,
  de,
  ja,
  zh,
  ko,
}

export function getTranslation(language: string): Translations {
  return translationMap[language] || translationMap.en
}

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code)
}

export function useTranslation(language?: string) {
  const translations = useMemo(
    () => getTranslation(language || 'en'),
    [language]
  )

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = translations[key]
      if (value === undefined) {
        // Fallback to English
        value = translationMap.en[key]
      }
      if (value === undefined) return key
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value!.replace(`{${k}}`, String(v))
        })
      }
      return value!
    },
    [translations]
  )

  return { t }
}