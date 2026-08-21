'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Stethoscope,
  Search,
  Phone,
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  SearchX,
  IndianRupee,
  CalendarDays,
  Building2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'doctors.title': 'Find a Doctor',
  'doctors.subtitle': 'Find qualified doctors and clinics near you',
  'doctors.searchPlaceholder': 'Search by doctor name or specialty...',
  'doctors.search': 'Search',
  'doctors.call': 'Call',
  'doctors.verified': 'Verified',
  'doctors.consultationFee': 'Consultation Fee',
  'doctors.available': 'Available',
  'doctors.unavailable': 'Unavailable',
  'doctors.empty.title': 'No Doctors Found',
  'doctors.empty.desc': 'Try adjusting your search or specialty filter',
  'doctors.error': 'Failed to load doctors',
  'doctors.specialty.all': 'All',
  'doctors.specialty.generalPhysician': 'General Physician',
  'doctors.specialty.cardiologist': 'Cardiologist',
  'doctors.specialty.dermatologist': 'Dermatologist',
  'doctors.specialty.pediatrician': 'Pediatrician',
  'doctors.specialty.orthopedic': 'Orthopedic',
  'doctors.specialty.neurologist': 'Neurologist',
  'doctors.specialty.ent': 'ENT',
  'doctors.specialty.gynecologist': 'Gynecologist',
  'doctors.specialty.ophthalmologist': 'Ophthalmologist',
  'doctors.specialty.dentist': 'Dentist',
  'doctors.specialty.psychiatrist': 'Psychiatrist',
  'doctors.days': 'Days',
  'doctors.hours': 'Hours',
  'doctors.clinic': 'Clinic',
  'doctors.specialty': 'Specialty',
}

const specialties = [
  { key: 'all', label: 'doctors.specialty.all' },
  { key: 'generalPhysician', label: 'doctors.specialty.generalPhysician' },
  { key: 'cardiologist', label: 'doctors.specialty.cardiologist' },
  { key: 'dermatologist', label: 'doctors.specialty.dermatologist' },
  { key: 'pediatrician', label: 'doctors.specialty.pediatrician' },
  { key: 'orthopedic', label: 'doctors.specialty.orthopedic' },
  { key: 'neurologist', label: 'doctors.specialty.neurologist' },
  { key: 'ent', label: 'doctors.specialty.ent' },
  { key: 'gynecologist', label: 'doctors.specialty.gynecologist' },
  { key: 'ophthalmologist', label: 'doctors.specialty.ophthalmologist' },
  { key: 'dentist', label: 'doctors.specialty.dentist' },
  { key: 'psychiatrist', label: 'doctors.specialty.psychiatrist' },
] as const

const specialtyColors: Record<string, string> = {
  generalPhysician: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cardiologist: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  dermatologist: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  pediatrician: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  orthopedic: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  neurologist: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  ent: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  gynecologist: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  ophthalmologist: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  dentist: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  psychiatrist: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

function tf(t: (key: string) => string, key: string, params?: Record<string, string | number>): string {
  let val = fallback[key] || t(key)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v))
    })
  }
  return val
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeMap = { sm: 'h-3 w-3', md: 'h-4 w-4' }
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            sizeMap[size],
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )
}

interface Doctor {
  id: string
  name: string
  specialty: string
  clinicName: string
  address: string
  rating: number
  reviewCount: number
  consultationFee: number
  availableDays: string[]
  availableHours: string
  phone: string
  verified: boolean
  city?: string
}

export default function FindDoctorScreen() {
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)
  const goBack = useAppStore(s => s.goBack)
  const currentLocation = useAppStore(s => s.currentLocation)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState<string>('all')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [searched, setSearched] = useState(false)

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    setError(false)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (activeSpecialty !== 'all') params.set('specialty', activeSpecialty)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (currentLocation?.city) params.set('city', currentLocation.city)
      const res = await fetch(`/api/doctors?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDoctors((data.doctors || data || []).map((d: Record<string, unknown>) => ({
        id: d.id || String(Math.random()),
        name: d.name || 'Unknown',
        specialty: d.specialty || 'generalPhysician',
        clinicName: d.clinicName || d.clinic || '',
        address: d.address || '',
        rating: d.rating || 0,
        reviewCount: d.reviewCount || 0,
        consultationFee: d.consultationFee || d.fee || 0,
        availableDays: d.availableDays || d.days || [],
        availableHours: d.availableHours || d.hours || '',
        phone: d.phone || '',
        verified: d.verified || false,
        city: d.city || '',
      })))
    } catch {
      setError(true)
      toast.error(tf(t, 'doctors.error'))
    } finally {
      setLoading(false)
    }
  }, [activeSpecialty, searchQuery, currentLocation, t])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDoctors()
  }

  const clearSearch = () => {
    setSearchQuery('')
    setActiveSpecialty('all')
  }

  const isTodayAvailable = (days: string[]): boolean => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
    return days.some(d => d.toLowerCase().startsWith(today))
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Button variant="ghost" size="icon" onClick={goBack} className="flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{tf(t, 'doctors.title')}</h1>
          </div>
        </div>
      </div>

      <p className="px-4 pb-3 text-sm text-muted-foreground">
        {tf(t, 'doctors.subtitle')}
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="px-4 pb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tf(t, 'doctors.searchPlaceholder')}
              className="pl-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button type="submit" disabled={loading}>
            {tf(t, 'doctors.search')}
          </Button>
        </div>
      </form>

      {/* Specialty Chips */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
        {specialties.map(spec => (
          <button
            key={spec.key}
            onClick={() => setActiveSpecialty(spec.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
              activeSpecialty === spec.key
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {tf(t, spec.label)}
          </button>
        ))}
      </div>

      <Separator />

      {/* Doctor List */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-lg" />
              ))}
            </div>
          ) : searched && (error || doctors.length === 0) ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-muted-foreground"
            >
              <div className="rounded-full bg-muted p-4 mb-4">
                <SearchX className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">{tf(t, 'doctors.empty.title')}</p>
              <p className="text-sm mt-1 text-center">{tf(t, 'doctors.empty.desc')}</p>
              <Button variant="outline" className="mt-4" onClick={clearSearch}>
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeSpecialty}-${searchQuery}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {doctors.map((doctor, index) => {
                  const todayAvailable = isTodayAvailable(doctor.availableDays)
                  return (
                    <motion.div
                      key={doctor.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className={cn(
                              'flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 text-lg font-bold',
                              specialtyColors[doctor.specialty] || 'bg-muted text-muted-foreground'
                            )}>
                              {doctor.name.charAt(0)}
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Name & Verified */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-bold">{doctor.name}</h4>
                                {doctor.verified && (
                                  <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                )}
                                {doctor.verified && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    {tf(t, 'doctors.verified')}
                                  </span>
                                )}
                              </div>

                              {/* Specialty Badge */}
                              <Badge className={cn('text-[10px]', specialtyColors[doctor.specialty] || 'bg-muted')}>
                                {tf(t, `doctors.specialty.${doctor.specialty}`)}
                              </Badge>

                              {/* Clinic & Address */}
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{doctor.clinicName}</span>
                                </div>
                                {doctor.address && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{doctor.address}</span>
                                  </div>
                                )}
                              </div>

                              {/* Rating & Fee */}
                              <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <StarRating rating={doctor.rating} />
                                  <span className="text-muted-foreground">
                                    {doctor.rating.toFixed(1)} ({doctor.reviewCount})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <IndianRupee className="h-3 w-3" />
                                  {doctor.consultationFee}
                                </div>
                              </div>

                              {/* Availability */}
                              <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  <span>{doctor.availableDays.join(', ')}</span>
                                </div>
                                {doctor.availableHours && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{doctor.availableHours}</span>
                                  </div>
                                )}
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'text-[9px] px-1.5 py-0 h-4',
                                    todayAvailable
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  )}
                                >
                                  {todayAvailable ? tf(t, 'doctors.available') : tf(t, 'doctors.unavailable')}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Call Button */}
                          {doctor.phone && (
                            <div className="mt-3 pt-3 border-t">
                              <Button
                                className="w-full"
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`tel:${doctor.phone}`, '_self')}
                              >
                                <Phone className="h-4 w-4 mr-1.5" />
                                {tf(t, 'doctors.call')} {doctor.phone}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}