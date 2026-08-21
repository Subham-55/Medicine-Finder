'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Search,
  Clock,
  Building2,
  Phone,
  Navigation,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'mapView.title': 'Pharmacy Map',
  'mapView.searchPlaceholder': 'Search by medicine name...',
  'mapView.openNow': 'Open Now',
  'mapView.alwaysOpen': '24/7',
  'mapView.all': 'All',
  'mapView.open': 'Open',
  'mapView.closed': 'Closed',
  'mapView.pharmacies': 'Pharmacies',
  'mapView.noPharmacies': 'No pharmacies found',
  'mapView.loadError': 'Failed to load pharmacies',
  'mapView.km': 'km',
  'mapView.legend': 'Legend',
}

const sectionFade = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

type FilterMode = 'all' | 'open' | '24/7'

interface MapPharmacy {
  id: string
  name: string
  address?: string
  city?: string
  phone?: string
  distance?: number
  isOpen: boolean
  is247?: boolean
  medicineCount?: number
  lat?: number
  lng?: number
}

// Deterministic pseudo-random positions for map pins
const getPinPosition = (id: string) => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  const x = 10 + Math.abs(hash % 80)
  const y = 10 + Math.abs(((hash * 7) >> 4) % 70)
  return { x, y }
}

export default function MapViewScreen() {
  const { goBack, currentLocation, setSelectedPharmacy, navigate } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const tf = (key: string) => t(key) || fallback[key] || key

  const [pharmacies, setPharmacies] = useState<MapPharmacy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [hoveredPin, setHoveredPin] = useState<string | null>(null)

  const fetchPharmacies = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentLocation?.city) params.set('city', currentLocation.city)
      if (searchQuery) params.set('hasMedicine', searchQuery)
      const res = await fetch(`/api/map/pharmacies?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPharmacies(Array.isArray(data) ? data : data.pharmacies || [])
      }
    } catch {
      toast.error(tf('mapView.loadError'))
    } finally {
      setLoading(false)
    }
  }, [currentLocation?.city, searchQuery])

  useEffect(() => {
    fetchPharmacies()
  }, [fetchPharmacies])

  const filteredPharmacies = pharmacies.filter((p) => {
    if (filter === 'open' && !p.isOpen) return false
    if (filter === '24/7' && !p.is247) return false
    return true
  })

  const handlePharmacyClick = (pharmacy: MapPharmacy) => {
    setSelectedPharmacy(pharmacy as any)
    navigate('pharmacy-detail')
  }

  const filterButtons: { value: FilterMode; label: string }[] = [
    { value: 'all', label: tf('mapView.all') },
    { value: 'open', label: tf('mapView.openNow') },
    { value: '24/7', label: tf('mapView.alwaysOpen') },
  ]

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3"
        >
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
              <MapPin className="size-5" />
              {tf('mapView.title')}
            </h1>
          </div>
        </motion.div>

        {/* Search + Filter */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tf('mapView.searchPlaceholder')}
              className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm shadow-none"
            />
          </div>
          <div className="flex gap-2">
            {filterButtons.map((fb) => (
              <button
                key={fb.value}
                onClick={() => setFilter(fb.value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                  filter === fb.value
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {fb.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Map Placeholder */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-neutral-200 shadow-none">
            <CardContent className="relative p-0">
              {/* Map area with grid */}
              <div
                className="relative h-64 w-full overflow-hidden sm:h-80"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                  backgroundColor: '#f5f5f0',
                }}
              >
                {/* Pseudo-random pins */}
                {filteredPharmacies.map((pharmacy) => {
                  const pos = getPinPosition(pharmacy.id)
                  const size = Math.min(12 + (pharmacy.medicineCount || 0) * 0.5, 24)
                  return (
                    <div
                      key={pharmacy.id}
                      className="absolute"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: hoveredPin === pharmacy.id ? 20 : 10,
                      }}
                      onMouseEnter={() => setHoveredPin(pharmacy.id)}
                      onMouseLeave={() => setHoveredPin(null)}
                      onClick={() => handlePharmacyClick(pharmacy)}
                    >
                      {/* Pin dot */}
                      <div
                        className="cursor-pointer rounded-full border-2 border-white shadow-md transition-transform hover:scale-125"
                        style={{
                          width: size,
                          height: size,
                          backgroundColor: pharmacy.isOpen ? '#22c55e' : '#ef4444',
                        }}
                      />
                      {/* Tooltip on hover */}
                      <AnimatePresence>
                        {hoveredPin === pharmacy.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="absolute left-1/2 top-full z-30 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
                          >
                            {pharmacy.name}
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-80">
                              <span
                                className="inline-block size-1.5 rounded-full"
                                style={{
                                  backgroundColor: pharmacy.isOpen ? '#22c55e' : '#ef4444',
                                }}
                              />
                              {pharmacy.isOpen ? tf('mapView.open') : tf('mapView.closed')}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}

                {/* Empty state on map */}
                {filteredPharmacies.length === 0 && !loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">{tf('mapView.noPharmacies')}</p>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 border-t border-neutral-100 px-4 py-2 text-xs text-muted-foreground">
                <span className="font-medium">{tf('mapView.legend')}:</span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-green-500" />
                  {tf('mapView.open')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-red-500" />
                  {tf('mapView.closed')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-neutral-400" />
                  Size = {tf('mapView.pharmacies').toLowerCase()} count
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pharmacy List */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">
            {filteredPharmacies.length} {tf('mapView.pharmacies').toLowerCase()}
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : filteredPharmacies.length === 0 ? (
            <Card className="border-dashed border-neutral-200 py-10 shadow-none">
              <CardContent className="text-center text-sm text-muted-foreground">
                {tf('mapView.noPharmacies')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredPharmacies.map((pharmacy, i) => (
                <motion.div
                  key={pharmacy.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                >
                  <Card
                    className="cursor-pointer border-neutral-100 py-0 shadow-none transition-colors hover:bg-neutral-50/60"
                    onClick={() => handlePharmacyClick(pharmacy)}
                  >
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <Building2 className="size-4 text-neutral-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-neutral-900">
                            {pharmacy.name}
                          </p>
                          <Badge
                            variant={pharmacy.isOpen ? 'default' : 'destructive'}
                            className="shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold"
                          >
                            {pharmacy.isOpen ? tf('mapView.open') : tf('mapView.closed')}
                          </Badge>
                          {pharmacy.is247 && (
                            <Badge className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0 text-[10px] font-semibold text-amber-700">
                              24/7
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {pharmacy.address || pharmacy.city || 'N/A'}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          {pharmacy.distance != null && (
                            <span className="flex items-center gap-1">
                              <Navigation className="size-3" />
                              {pharmacy.distance.toFixed(1)} {tf('mapView.km')}
                            </span>
                          )}
                          {pharmacy.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" />
                              {pharmacy.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}