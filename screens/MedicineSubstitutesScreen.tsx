'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Sparkles,
  Search,
  SearchX,
  Pill,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Tag,
  Building2,
  FlaskConical,
  CircleCheck,
  CircleX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations for substitutes keys
const substitutesFallback: Record<string, string> = {
  'substitutes.title': 'AI Medicine Substitutes',
  'substitutes.subtitle': 'Find affordable generic alternatives to expensive branded medicines',
  'substitutes.searchPlaceholder': 'Enter medicine name (e.g. Dolo 650, Crocin...)',
  'substitutes.findBtn': 'Find Substitutes',
  'substitutes.searching': 'AI is analyzing medicines',
  'substitutes.popularSearches': 'Popular Searches',
  'substitutes.originalMedicine': 'Original Medicine',
  'substitutes.genericAlternatives': 'Generic Alternatives',
  'substitutes.savings': 'Save {percent}',
  'substitutes.searchThis': 'Search This',
  'substitutes.manufacturer': 'Manufacturer',
  'substitutes.composition': 'Composition',
  'substitutes.priceRange': 'Price Range',
  'substitutes.uses': 'Uses',
  'substitutes.category': 'Category',
  'substitutes.disclaimer': 'Consult your doctor before switching medicines. Generic alternatives contain the same active ingredients but may have different inactive ingredients.',
  'substitutes.empty.title': 'Find Cheaper Alternatives',
  'substitutes.empty.desc': 'Search for a branded medicine to discover affordable generic substitutes with the same active ingredients.',
  'substitutes.error.title': 'Something went wrong',
  'substitutes.error.desc': 'Failed to get medicine suggestions. Please try again.',
  'substitutes.tryAgain': 'Try Again',
  'substitutes.noResults': 'No substitutes found',
  'substitutes.noResultsDesc': 'We couldn\'t find generic alternatives for this medicine. Try a different search.',
  'substitutes.inStock': 'In Stock',
  'substitutes.outOfStock': 'Out of Stock',
  'substitutes.note': 'Note',
}

interface OriginalMedicine {
  name: string
  genericName: string
  category: string
  typicalPrice: string
  uses: string
}

interface Substitute {
  name: string
  manufacturer: string
  genericComposition: string
  priceRange: string
  estimatedSavings: string
  inStock: boolean
  note: string
}

interface SubstituteResult {
  originalMedicine: OriginalMedicine
  substitutes: Substitute[]
  disclaimer: string
}

const POPULAR_MEDICINES = ['Dolo 650', 'Crocin Advance', 'Combiflam', 'Azithral 500', 'Pan 40', 'Shelcal 500']

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

function ShimmerDot() {
  return (
    <span className="inline-flex gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-2 w-2 rounded-full bg-violet-500"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

function OriginalMedicineSkeleton() {
  return (
    <Card className="border-2 border-violet-200 dark:border-violet-800 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-100/60 via-transparent to-violet-100/60 animate-[shimmer_2s_infinite] pointer-events-none" />
      <CardContent className="p-4 sm:p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
      </CardContent>
    </Card>
  )
}

function SubstituteCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full max-w-sm" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function MedicineSubstitutesScreen() {
  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)
  const navigate = useAppStore((s) => s.navigate)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const goBack = useAppStore((s) => s.goBack)

  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SubstituteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Wrapper around t() with inline fallback for substitutes keys
  const st = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const val = t(key, params)
      // If t() returns the key itself (not found), use fallback
      if (val === key && substitutesFallback[key]) {
        let fb = substitutesFallback[key]
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            fb = fb.replace(`{${k}}`, String(v))
          })
        }
        return fb
      }
      return val
    },
    [t]
  )

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery || query).trim()
      if (!q) {
        toast.error('Please enter a medicine name')
        return
      }

      setQuery(q)
      setIsLoading(true)
      setError(null)
      setResult(null)

      try {
        const res = await fetch('/api/medicine-substitutes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medicineName: q }),
        })

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`)
        }

        const data: SubstituteResult = await res.json()
        setResult(data)

        if (!data.substitutes || data.substitutes.length === 0) {
          toast.info(st('substitutes.noResults'))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        toast.error(st('substitutes.error.title'))
      } finally {
        setIsLoading(false)
      }
    },
    [query, st]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch()
      }
    },
    [handleSearch]
  )

  const handleSearchThis = useCallback(
    (medicineName: string) => {
      setSearchQuery(medicineName)
      navigate('search-results')
    },
    [setSearchQuery, navigate]
  )

  const handlePopularChip = useCallback(
    (name: string) => {
      setQuery(name)
      handleSearch(name)
    },
    [handleSearch]
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto w-full">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={goBack}
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="size-5 text-violet-500 shrink-0" />
            <h1 className="text-lg font-bold truncate">{st('substitutes.title')}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        {/* AI Title Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800">
            <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              AI-Powered
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {st('substitutes.title')}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            {st('substitutes.subtitle')}
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={st('substitutes.searchPlaceholder')}
                className="pl-10 h-12 text-base"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={isLoading || !query.trim()}
              className="h-12 px-4 sm:px-6 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
            >
              <Sparkles className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">{st('substitutes.findBtn')}</span>
            </Button>
          </div>
        </motion.div>

        {/* Popular Searches Chips */}
        {!result && !isLoading && !error && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {st('substitutes.popularSearches')}
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_MEDICINES.map((med) => (
                <motion.button
                  key={med}
                  onClick={() => handlePopularChip(med)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground hover:bg-violet-100 dark:hover:bg-violet-950/50 hover:text-violet-700 dark:hover:text-violet-300 border border-transparent hover:border-violet-200 dark:hover:border-violet-800 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Pill className="size-3.5" />
                  {med}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {/* Empty State */}
          {!isLoading && !result && !error && (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-12 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative mb-6">
                <div className="size-24 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                  <Pill className="size-10 text-violet-500 dark:text-violet-400" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 size-8 rounded-full bg-violet-600 flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="size-4 text-white" />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold mb-2">{st('substitutes.empty.title')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-4">
                {st('substitutes.empty.desc')}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm">
                <Search className="size-4" />
                <span>Try: Dolo 650, Augmentin 625, Pan D, Shelcal 500</span>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              key="loading"
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* AI loading animation */}
              <div className="flex items-center justify-center gap-2 py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="size-5 text-violet-500" />
                </motion.div>
                <span className="text-violet-600 dark:text-violet-400 font-medium">
                  {st('substitutes.searching')}
                </span>
                <ShimmerDot />
              </div>

              {/* Skeleton cards */}
              <div className="space-y-4">
                <OriginalMedicineSkeleton />
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 * (i + 1) }}
                  >
                    <SubstituteCardSkeleton />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <motion.div
              key="error"
              className="flex flex-col items-center justify-center py-12 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="size-10 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">{st('substitutes.error.title')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                {st('substitutes.error.desc')}
              </p>
              <Button
                variant="outline"
                onClick={() => handleSearch()}
                className="gap-2"
              >
                <AlertTriangle className="size-4" />
                {st('substitutes.tryAgain')}
              </Button>
            </motion.div>
          )}

          {/* Results State */}
          {!isLoading && result && (
            <motion.div
              key="results"
              className="space-y-6"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {/* Original Medicine Card */}
              <motion.div variants={fadeUp}>
                <Card className="relative overflow-hidden border-2 border-violet-300 dark:border-violet-700">
                  {/* Gradient border effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-violet-500/10 pointer-events-none" />
                  <CardContent className="relative p-4 sm:p-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">
                          {st('substitutes.originalMedicine')}
                        </p>
                        <h3 className="text-xl sm:text-2xl font-bold truncate">
                          {result.originalMedicine.name}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-0.5">
                          {result.originalMedicine.genericName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                          {result.originalMedicine.typicalPrice}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Tag className="size-3" />
                        {st('substitutes.category')}: {result.originalMedicine.category}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="size-4 mt-0.5 shrink-0 text-violet-500" />
                      <span>{result.originalMedicine.uses}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Substitutes Heading */}
              <motion.div variants={fadeUp} className="flex items-center gap-3">
                <h3 className="text-lg font-bold">{st('substitutes.genericAlternatives')}</h3>
                <Badge className="bg-violet-600 text-white hover:bg-violet-700">
                  {result.substitutes.length}
                </Badge>
              </motion.div>

              {/* Substitutes List */}
              {result.substitutes.length > 0 ? (
                <div className="space-y-3">
                  {result.substitutes.map((sub, index) => {
                    const savingsNum = parseInt(sub.estimatedSavings.replace(/[^0-9]/g, ''), 10) || 0
                    return (
                      <motion.div
                        key={sub.name}
                        variants={fadeUp}
                        transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                      >
                        <Card className="hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4 sm:p-6 space-y-3">
                            {/* Top: Name + Savings */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-bold text-base truncate">{sub.name}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <Building2 className="size-3.5 shrink-0" />
                                  {sub.manufacturer}
                                </p>
                              </div>
                              {savingsNum > 0 && (
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 shrink-0 text-sm px-2.5 py-1">
                                  {st('substitutes.savings', { percent: sub.estimatedSavings })}
                                </Badge>
                              )}
                            </div>

                            {/* Composition */}
                            <div className="flex items-start gap-2 text-sm">
                              <FlaskConical className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                              <div>
                                <span className="text-muted-foreground text-xs font-medium">{st('substitutes.composition')}: </span>
                                <span className="text-foreground">{sub.genericComposition}</span>
                              </div>
                            </div>

                            {/* Price + Stock */}
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <Tag className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {sub.priceRange}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                {sub.inStock ? (
                                  <>
                                    <CircleCheck className="size-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                      {st('substitutes.inStock')}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <CircleX className="size-4 text-destructive" />
                                    <span className="text-destructive font-medium">
                                      {st('substitutes.outOfStock')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Note */}
                            {sub.note && (
                              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                                <Clock className="size-4 mt-0.5 shrink-0" />
                                <span>{sub.note}</span>
                              </div>
                            )}

                            {/* Action */}
                            <div className="pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => handleSearchThis(sub.name)}
                              >
                                <Search className="size-3.5" />
                                {st('substitutes.searchThis')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                /* No Results */
                <motion.div
                  variants={fadeUp}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <SearchX className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{st('substitutes.noResults')}</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {st('substitutes.noResultsDesc')}
                  </p>
                </motion.div>
              )}

              {/* Disclaimer */}
              <motion.div
                variants={fadeUp}
                className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
              >
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
                  {result.disclaimer || st('substitutes.disclaimer')}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

