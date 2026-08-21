'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, Clock, X, TrendingUp, Mic, MicOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { popularMedicines } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { SearchSuggestion } from '@/lib/store'

export default function SearchScreen() {
  const {
    navigate,
    goBack,
    setSearchQuery,
    addRecentSearch,
    setIsSearching,
    setSearchResults,
    recentSearches,
    clearRecentSearches,
  } = useAppStore()

  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    inputRef.current?.focus()

    // Check Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-IN'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsFetchingSuggestions(true)
    try {
      const res = await fetch(`/api/search?type=suggestions&q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(data.suggestions?.length > 0)
      }
    } catch {
      setSuggestions([])
    } finally {
      setIsFetchingSuggestions(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchSuggestions])

  const handleSearch = async (searchTerm: string) => {
    const term = searchTerm.trim()
    if (!term) return

    setSearchQuery(term)
    addRecentSearch(term)
    setIsSearching(true)
    setShowSuggestions(false)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
      }
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
      navigate('search-results')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name)
    handleSearch(suggestion.name)
  }

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery)
    handleSearch(recentQuery)
  }

  const handlePopularClick = (medicine: string) => {
    setQuery(medicine)
    handleSearch(medicine)
  }

  const handleClearQuery = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="shrink-0"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="relative flex-1">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
                  placeholder={t('search.placeholder')}
                  className={cn(
                    'h-11 pl-10 text-base bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-border rounded-xl',
                    query ? 'pr-10' : speechSupported ? 'pr-20' : 'pr-4'
                  )}
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                )}
                {!query && speechSupported && (
                  <button
                    type="button"
                    onClick={toggleVoiceSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isListening ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <Mic className="size-4 text-destructive" />
                      </motion.div>
                    ) : (
                      <Mic className="size-4" />
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-xl shadow-lg z-50 origin-top overflow-hidden"
                >
                  {isFetchingSuggestions ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                          <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="max-h-64">
                      <div className="p-1">
                        {suggestions.map((suggestion, index) => (
                          <motion.button
                            key={suggestion.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                          >
                            <Search className="size-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {suggestion.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {suggestion.genericName} &middot; {suggestion.category}
                              </p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-8">
          {/* Popular Medicines */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('search.popularMedicines')}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularMedicines.map((medicine, index) => (
                <motion.button
                  key={medicine}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index, duration: 0.2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePopularClick(medicine)}
                  className="inline-flex items-center"
                >
                  <Badge
                    variant="outline"
                    className="px-3 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors rounded-full"
                  >
                    {medicine}
                  </Badge>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('search.recentSearches')}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t('search.clearAll')}
                </Button>
              </div>
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {recentSearches.map((recent, index) => (
                    <motion.button
                      key={recent.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      onClick={() => handleRecentClick(recent.query)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left group"
                    >
                      <Clock className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                      <span className="flex-1 text-sm truncate">{recent.query}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(recent.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  )
}