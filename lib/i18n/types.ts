export type Language = {
  code: string
  name: string
  nativeName: string
  flag: string
  dir: 'ltr' | 'rtl'
}

export type Translations = Record<string, string>
export type TranslationMap = Record<string, Translations>