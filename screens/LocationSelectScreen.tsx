'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft,
  Search,
  MapPin,
  Hash,
  Loader2,
  MapPinned,
  Navigation,
  Globe2,
  ChevronRight,
  CheckCircle2,
  Building2,
  X,
  LocateFixed,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────
interface PincodeResult {
  id: string
  name: string
  pincode: string
  state: string
}

interface StateInfo {
  state: string
  count: number
}

// ── Animation ────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const itemFade = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3 },
  }),
}

// ── Component ────────────────────────────────────────────────────────────
export default function LocationSelectScreen() {
  const { setCurrentLocation, navigate, goBack } = useAppStore()

  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  // View modes: 'home' | 'pincode' | 'state' | 'state-detail' | 'locate'
  const [view, setView] = useState<'home' | 'pincode' | 'state' | 'state-detail' | 'locate'>('home')

  // Pin code search
  const [pinQuery, setPinQuery] = useState('')
  const [pinResults, setPinResults] = useState<PincodeResult[]>([])
  const [pinLoading, setPinLoading] = useState(false)
  const [pinSearched, setPinSearched] = useState(false)
  const [pinError, setPinError] = useState('')

  // State listing
  const [states, setStates] = useState<StateInfo[]>([])
  const [statesLoading, setStatesLoading] = useState(false)

  // State detail (locations in a state)
  const [selectedState, setSelectedState] = useState('')
  const [stateLocations, setStateLocations] = useState<PincodeResult[]>([])
  const [stateSearch, setStateSearch] = useState('')
  const [stateLoading, setStateLoading] = useState(false)

  // Locate me
  const [locating, setLocating] = useState(false)

  // ── Fetch all states ───────────────────────────────────────────────────
  const fetchStates = useCallback(async () => {
    setStatesLoading(true)
    try {
      const res = await fetch('/api/pincode?states=true')
      if (res.ok) {
        const data = await res.json()
        setStates(data.states || [])
      }
    } catch {
      // silent
    } finally {
      setStatesLoading(false)
    }
  }, [])

  // ── Pin code search ────────────────────────────────────────────────────
  const searchPincode = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setPinResults([])
      setPinSearched(false)
      setPinError('')
      return
    }

    setPinLoading(true)
    setPinError('')
    try {
      // If 6 digits, do exact pin lookup
      if (/^\d{6}$/.test(trimmed)) {
        const res = await fetch(`/api/pincode?pin=${trimmed}`)
        if (res.ok) {
          const data = await res.json()
          if (data.results) {
            setPinResults(data.results)
            setPinSearched(true)
          } else {
            setPinResults([])
            setPinError(t('location.pinCode.notFound'))
            setPinSearched(true)
          }
        }
      } else {
        // General search
        const res = await fetch(`/api/pincode?search=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const data = await res.json()
          setPinResults(data.results || [])
          setPinSearched(true)
        }
      }
    } catch {
      setPinError(t('location.searchFailed'))
    } finally {
      setPinLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pinQuery.length >= 2) searchPincode(pinQuery)
      else {
        setPinResults([])
        setPinSearched(false)
        setPinError('')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [pinQuery, searchPincode])

  // ── Fetch locations for a state ────────────────────────────────────────
  const fetchStateLocations = useCallback(async (stateName: string) => {
    setSelectedState(stateName)
    setStateSearch('')
    setStateLoading(true)
    setView('state-detail')
    try {
      const res = await fetch(`/api/pincode?state=${encodeURIComponent(stateName)}`)
      if (res.ok) {
        const data = await res.json()
        setStateLocations(data.results || [])
      }
    } catch {
      toast.error(t('location.loadFailed'))
    } finally {
      setStateLoading(false)
    }
  }, [])

  // ── Filter state locations by search ───────────────────────────────────
  const filteredStateLocations = stateSearch
    ? stateLocations.filter(
        (l) =>
          l.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
          l.pincode.includes(stateSearch)
      )
    : stateLocations

  // ── Locate me (GPS) ────────────────────────────────────────────────────
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t('location.gpsNotSupported'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // Use geocode API to reverse lookup
          const res = await fetch(
            `/api/geocode?lat=${latitude}&lng=${longitude}`
          )
          if (res.ok) {
            const data = await res.json()
            if (data.city || data.state) {
              setCurrentLocation({
                country: data.country || 'India',
                state: data.state || '',
                city: data.city || data.locality || '',
                lat: latitude,
                lng: longitude,
              })
              toast.success(t('location.detectedToast', { location: data.city || data.locality || data.state }))
              navigate('dashboard')
            } else {
              setCurrentLocation({
                country: 'India',
                state: 'Detected via GPS',
                city: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
                lat: latitude,
                lng: longitude,
              })
              toast.success(t('location.gpsToast'))
              navigate('dashboard')
            }
          } else {
            // Fallback: use coordinates directly
            setCurrentLocation({
              country: 'India',
              state: 'Detected via GPS',
              city: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
              lat: latitude,
              lng: longitude,
            })
            toast.success('Location detected via GPS')
            navigate('dashboard')
          }
        } catch {
          setCurrentLocation({
            country: 'India',
            state: 'Detected via GPS',
            city: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
            lat: latitude,
            lng: longitude,
          })
          toast.success('Location detected via GPS')
          navigate('dashboard')
        }
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) {
          toast.error(t('location.gpsDenied'))
        } else {
          toast.error(t('location.gpsFailed'))
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [setCurrentLocation, navigate])

  // ── Select a location ──────────────────────────────────────────────────
  const handleSelectLocation = (result: PincodeResult) => {
    setCurrentLocation({
      country: 'India',
      state: result.state,
      city: result.name,
    })
    toast.success(t('location.detectedToast', { location: `${result.name}, ${result.state}` }))
    navigate('dashboard')
  }

  // ── Render: Home ───────────────────────────────────────────────────────
  const renderHome = () => (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
      {/* Pin Code Search Card */}
      <Card className="border-neutral-100 shadow-none">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50">
              <Hash className="size-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('location.pinCode.title')}</h3>
              <p className="text-xs text-muted-foreground">{t('location.pinCode.desc')}</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={pinQuery}
              onChange={(e) => setPinQuery(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('location.pinCode.placeholder')}
              className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
              maxLength={6}
              inputMode="numeric"
            />
            {pinLoading && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {pinSearched && pinResults.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                {pinResults.length} {t('location.pinCode.results')}
              </p>
              {pinResults.slice(0, 5).map((r) => (
                <motion.button
                  key={r.id}
                  variants={itemFade}
                  initial="hidden"
                  animate="visible"
                  onClick={() => handleSelectLocation(r)}
                  className="flex w-full items-center gap-3 rounded-lg border border-neutral-100 p-2.5 text-left transition-colors hover:bg-neutral-50 active:scale-[0.98]"
                >
                  <MapPin className="size-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.pincode} &bull; {r.state}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          )}
          {pinSearched && pinResults.length === 0 && pinError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3">
              <MapPin className="size-4 text-red-400" />
              <p className="text-xs text-red-600">{pinError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browse by State */}
      <Card
        className="border-neutral-100 shadow-none transition-colors hover:bg-neutral-50/60 cursor-pointer active:scale-[0.98]"
        onClick={() => {
          setView('state')
          if (states.length === 0) fetchStates()
        }}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50">
            <Globe2 className="size-4 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">{t('location.browseState.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('location.browseState.desc')}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Locate Me */}
      <Card
        className="border-neutral-100 shadow-none transition-colors hover:bg-neutral-50/60 cursor-pointer active:scale-[0.98]"
        onClick={handleLocateMe}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50">
            <Navigation className="size-4 text-sky-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">{t('location.gps.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('location.gps.desc')}</p>
          </div>
          {locating ? (
            <Loader2 className="size-5 shrink-0 animate-spin text-sky-500" />
          ) : (
            <LocateFixed className="size-5 shrink-0 text-muted-foreground" />
          )}
        </CardContent>
      </Card>

      {/* Search by Location Name */}
      <Card
        className="border-neutral-100 shadow-none transition-colors hover:bg-neutral-50/60 cursor-pointer active:scale-[0.98]"
        onClick={() => {
          setView('pincode')
          setPinQuery('')
          setPinResults([])
          setPinSearched(false)
        }}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50">
            <Building2 className="size-4 text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">Search by Location Name</h3>
            <p className="text-xs text-muted-foreground">Search by city, area, or post office name</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ── Render: Pincode / Name Search ─────────────────────────────────────
  const renderPincodeSearch = () => (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={pinQuery}
          onChange={(e) => setPinQuery(e.target.value)}
          placeholder={t('location.searchPlaceholder')}
          className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-10 pr-10 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
        />
        {pinQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
            onClick={() => {
              setPinQuery('')
              setPinResults([])
              setPinSearched(false)
              setPinError('')
            }}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Quick: Enter PIN code */}
      {!pinQuery && (
        <Card className="border-neutral-100 shadow-none">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground">{t('location.orPinCode')}</p>
            </div>
            <Input
              placeholder={t('location.pinCodeLabel')}
              className="h-10 rounded-lg border-neutral-200 bg-neutral-50 text-sm text-center tracking-widest font-mono text-lg shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
              maxLength={6}
              inputMode="numeric"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setPinQuery(val)
                if (val.length === 6) searchPincode(val)
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {pinLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">{t('location.searching')}</span>
        </div>
      )}

      {/* Results */}
      {!pinLoading && pinSearched && pinResults.length > 0 && (
        <div className="space-y-1.5">
          <p className="px-1 text-xs text-muted-foreground">
            {pinResults.length} {t('location.searchResults')}
          </p>
          <ScrollArea className="max-h-[60vh]">
            {pinResults.map((r, i) => (
              <motion.button
                key={r.id}
                custom={i}
                variants={itemFade}
                initial="hidden"
                animate="visible"
                onClick={() => handleSelectLocation(r)}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-100 p-3 text-left transition-colors hover:bg-neutral-50 active:scale-[0.98]"
              >
                <MapPin className="size-4 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.pincode} &bull; {r.state}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-md px-2 py-0 text-[10px] font-mono"
                >
                  {r.pincode}
                </Badge>
              </motion.button>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* No results */}
      {!pinLoading && pinSearched && pinResults.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MapPinned className="size-10 text-neutral-300" />
          <div>
            <p className="text-sm font-medium text-neutral-900">{t('location.noLocations')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pinError || t('location.noLocationsDesc')}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!pinLoading && !pinSearched && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Search className="size-10 text-neutral-300" />
          <div>
            <p className="text-sm font-medium text-neutral-900">{t('location.searchEmpty')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('location.searchEmptyDesc')}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )

  // ── Render: State List ─────────────────────────────────────────────────
  const renderStateList = () => (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
      <p className="text-xs text-muted-foreground">{t('location.selectState')}</p>

      {statesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="max-h-[70vh]">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {states.map((s, i) => (
              <motion.button
                key={s.state}
                custom={i}
                variants={itemFade}
                initial="hidden"
                animate="visible"
                onClick={() => fetchStateLocations(s.state)}
                className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 p-3 text-left transition-colors hover:bg-neutral-50 active:scale-[0.98]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.state}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.count.toLocaleString()} {t('location.locationsCount')}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  )

  // ── Render: State Detail ───────────────────────────────────────────────
  const renderStateDetail = () => (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
      {/* Search within state */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={stateSearch}
          onChange={(e) => setStateSearch(e.target.value)}
          placeholder={t('location.searchInState', { state: selectedState })}
          className="h-10 rounded-xl border-neutral-200 bg-neutral-50 pl-10 pr-10 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
        />
        {stateSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
            onClick={() => setStateSearch('')}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredStateLocations.length} {t('location.locationsInState', { state: selectedState })}
      </p>

      {stateLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredStateLocations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MapPinned className="size-10 text-neutral-300" />
          <p className="text-sm text-muted-foreground">{t('location.noMatch')}</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-1.5">
            {filteredStateLocations.map((loc, i) => (
              <motion.button
                key={loc.id}
                custom={Math.min(i, 20)}
                variants={itemFade}
                initial="hidden"
                animate="visible"
                onClick={() => handleSelectLocation(loc)}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-100 p-3 text-left transition-colors hover:bg-neutral-50 active:scale-[0.98]"
              >
                <MapPin className="size-4 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{loc.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{loc.state}</p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-md px-2 py-0 text-[10px] font-mono"
                >
                  {loc.pincode}
                </Badge>
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  )

  // ── Header based on view ───────────────────────────────────────────────
  const getHeaderInfo = () => {
    switch (view) {
      case 'home':
        return { title: t('location.title'), subtitle: t('location.subtitle') }
      case 'pincode':
        return { title: t('location.searchHeader'), subtitle: t('location.searchHeaderDesc') }
      case 'state':
        return { title: t('location.browseHeader'), subtitle: t('location.browseHeaderDesc') }
      case 'state-detail':
        return { title: selectedState, subtitle: t('location.selectHeaderDesc') }
      case 'locate':
        return { title: t('location.detecting'), subtitle: t('location.detectingDesc') }
      default:
        return { title: t('location.selectHeader'), subtitle: '' }
    }
  }

  const headerInfo = getHeaderInfo()
  const showBack = view !== 'home'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (view === 'state-detail') setView('state')
              else setView('home')
              setPinQuery('')
              setPinResults([])
              setPinSearched(false)
              setPinError('')
            }}
            className="mt-0.5 shrink-0"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{headerInfo.title}</h1>
          <p className="text-sm text-muted-foreground">{headerInfo.subtitle}</p>
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pb-8 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'home' && renderHome()}
            {view === 'pincode' && renderPincodeSearch()}
            {view === 'state' && renderStateList()}
            {view === 'state-detail' && renderStateDetail()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}