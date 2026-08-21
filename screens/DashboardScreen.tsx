'use client'

import { useState, useRef, useEffect, useCallback, useMemo, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Mic,
  MapPin,
  Pill,
  Store,
  BarChart3,
  Star,
  Clock,
  ChevronRight,
  Navigation,
  X,
  Sparkles,
  ScanLine,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { popularMedicines, allPharmacies, getNearbyPharmacies } from '@/lib/mock-data'
import type { PharmacyData } from '@/lib/data/pharmacies'

// ── Animation helpers ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const sectionFade = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ── Greeting helper ────────────────────────────────────────────────────
function getGreeting(t: (key: string) => string): string {
  const h = new Date().getHours()
  if (h < 12) return t('dashboard.greeting.morning')
  if (h < 17) return t('dashboard.greeting.afternoon')
  return t('dashboard.greeting.evening')
}

// ── Quick Action ───────────────────────────────────────────────────────
interface QuickAction {
  labelKey: string
  icon: React.ReactNode
  screen: string
  query?: string
  ai?: boolean
}

const quickActions: QuickAction[] = [
  { labelKey: 'dashboard.action.searchMedicine', icon: <Pill className="size-5" />, screen: 'search' },
  { labelKey: 'dashboard.action.nearbyStores', icon: <Store className="size-5" />, screen: 'search-results', query: '' },
  { labelKey: 'dashboard.action.priceCompare', icon: <BarChart3 className="size-5" />, screen: 'search' },
  { labelKey: 'dashboard.action.savedLocations', icon: <MapPin className="size-5" />, screen: 'saved-locations' },
  { labelKey: 'dashboard.action.aiSubstitutes', icon: <Sparkles className="size-5" />, screen: 'medicine-substitutes', ai: true },
  { labelKey: 'dashboard.action.prescriptionScanner', icon: <ScanLine className="size-5" />, screen: 'prescription-scanner', ai: true },
]

// ── Component ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const {
    user,
    currentLocation,
    recentSearches,
    navigate,
    setSearchQuery,
    addRecentSearch,
    clearRecentSearches,
    setSelectedPharmacy,
  } = useAppStore()

  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)

  const [searchFocused, setSearchFocused] = useState(false)
  const [localQuery, setLocalQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Close recent searches dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = useCallback(
    (query?: string) => {
      const q = (query ?? localQuery).trim()
      if (!q) return
      addRecentSearch(q)
      setSearchQuery(q)
      setLocalQuery('')
      setSearchFocused(false)
      navigate('search-results')
    },
    [localQuery, addRecentSearch, setSearchQuery, navigate],
  )

  const handleRecentTap = useCallback(
    (query: string) => {
      setSearchQuery(query)
      addRecentSearch(query)
      navigate('search-results')
    },
    [setSearchQuery, addRecentSearch, navigate],
  )

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      if (action.query !== undefined) {
        setSearchQuery(action.query)
      }
      navigate(action.screen)
    },
    [setSearchQuery, navigate],
  )

  const nearbyPharmacies = useMemo(() => {
    if (currentLocation) {
      const loc = currentLocation
      return getNearbyPharmacies(loc.country || 'India', loc.state || 'West Bengal', loc.city || 'Bankura', 6)
    }
    return []
  }, [currentLocation])

  const handlePharmacyTap = useCallback(
    (pharmacy: PharmacyData) => {
      // Convert PharmacyData to the store's Pharmacy format
      setSelectedPharmacy({
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        phone: pharmacy.phone,
        rating: pharmacy.rating,
        reviewCount: pharmacy.reviewCount,
        distance: pharmacy.distance,
        travelTime: pharmacy.travelTime,
        isOpen: pharmacy.isOpen,
        workingHours: pharmacy.workingHours,
        lat: pharmacy.lat,
        lng: pharmacy.lng,
        medicines: [],
      })
      navigate('pharmacy-detail')
    },
    [setSelectedPharmacy, navigate],
  )

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* ─── 1. Header ──────────────────────────────────────────────── */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        animate="visible"
        className="px-4 pt-6 pb-2 sm:px-6"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {getGreeting(t)}, {user?.name || t('dashboard.greeting.fallback')}
            </h1>
            <button
              onClick={() => navigate('location-select')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <MapPin className="size-3.5" />
              <span className="max-w-[200px] truncate">
                {currentLocation
                  ? `${currentLocation.city}${currentLocation.state ? `, ${currentLocation.state}` : ''}`
                  : t('dashboard.selectLocation')}
              </span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('location-select')}
            className="shrink-0"
          >
            {t('dashboard.change')}
          </Button>
        </div>
      </motion.section>

      {/* ─── 2. Search Bar ──────────────────────────────────────────── */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        animate="visible"
        className="px-4 pt-3 sm:px-6"
      >
        <div className="relative">
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              handleSearch()
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={t('dashboard.searchPlaceholder')}
              className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-10 pr-20 text-sm shadow-none transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-white transition-colors hover:bg-neutral-800"
              onClick={() => handleSearch()}
            >
              <Mic className="size-3.5" />
              <span className="text-xs font-medium">{t('common.search')}</span>
            </button>
          </form>

          {/* Recent searches dropdown */}
          <AnimatePresence>
            {searchFocused && recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border bg-white shadow-lg"
              >
                <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                  <span className="text-xs font-medium text-muted-foreground">{t('dashboard.recentSearches')}</span>
                  <button
                    onClick={() => clearRecentSearches()}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t('dashboard.clearAll')}
                  </button>
                </div>
                <ScrollArea className="max-h-48">
                  <div className="pb-1">
                    {recentSearches.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          handleRecentTap(s.query)
                          setSearchFocused(false)
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
                      >
                        <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{s.query}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Popular medicines */}
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t('dashboard.popularMedicines')}</p>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {popularMedicines.slice(0, 12).map((med, i) => (
                <motion.button
                  key={med}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  onClick={() => handleSearch(med)}
                  className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.97]"
                >
                  {med}
                </motion.button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-0" />
          </ScrollArea>
        </div>
      </motion.section>

      {/* ─── 3. Quick Actions Grid ──────────────────────────────────── */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        animate="visible"
        className="px-4 pt-5 sm:px-6"
      >
        <h2 className="mb-3 text-sm font-semibold tracking-tight">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <motion.div key={action.labelKey} custom={i} variants={fadeUp} initial="hidden" animate="visible">
              <motion.div whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Card
                  className="cursor-pointer gap-0 overflow-hidden border-neutral-100 py-0 shadow-none transition-colors hover:border-neutral-200 hover:bg-neutral-50/60"
                  onClick={() => handleQuickAction(action)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl text-neutral-700",
                      action.ai ? 'bg-violet-100 text-violet-600' : 'bg-neutral-100'
                    )}>
                      {action.icon}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium leading-tight text-neutral-900 truncate">
                        {t(action.labelKey)}
                      </span>
                      {action.ai && (
                        <span className="text-[10px] font-medium text-violet-500">AI Powered</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─── 4. Nearby Medical Stores ───────────────────────────────── */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        animate="visible"
        className="px-4 pt-6 sm:px-6"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">{t('dashboard.nearbyStores')}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              navigate('search-results')
            }}
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
          >
            {t('dashboard.viewAll')}
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        <div className="space-y-3">
          {nearbyPharmacies.map((pharmacy, i) => (
            <motion.div
              key={pharmacy.id}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <motion.div whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Card
                  className="cursor-pointer gap-0 overflow-hidden border-neutral-100 py-0 shadow-none transition-colors hover:border-neutral-200 hover:bg-neutral-50/60"
                  onClick={() => handlePharmacyTap(pharmacy)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-neutral-900">
                            {pharmacy.name}
                          </h3>
                          <Badge
                            variant={pharmacy.isOpen ? 'default' : 'destructive'}
                            className="shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold"
                          >
                            {pharmacy.isOpen ? t('common.open') : t('common.closed')}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {pharmacy.address}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-neutral-800">{pharmacy.rating}</span>
                        <span>({pharmacy.reviewCount})</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Navigation className="size-3" />
                        {pharmacy.distance} {t('common.km')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {pharmacy.travelTime}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─── 5. Recent Searches ─────────────────────────────────────── */}
      <AnimatePresence>
        {recentSearches.length > 0 && (
          <motion.section
            variants={sectionFade}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 8 }}
            className="px-4 pt-6 sm:px-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">{t('dashboard.recentSearches')}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              >
                <X className="size-3.5" />
                {t('dashboard.clearAll')}
              </Button>
            </div>

            <div className="space-y-1">
              {recentSearches.map((search, i) => (
                <motion.button
                  key={search.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  onClick={() => handleRecentTap(search.query)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm text-neutral-700">{search.query}</span>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}