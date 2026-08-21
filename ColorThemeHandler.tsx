'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export default function ColorThemeHandler() {
  const { user } = useAppStore()
  const colorTheme = user?.colorTheme || 'default'

  useEffect(() => {
    const html = document.documentElement
    if (colorTheme && colorTheme !== 'default') {
      html.setAttribute('data-theme', colorTheme)
    } else {
      html.removeAttribute('data-theme')
    }
  }, [colorTheme])

  return null
}