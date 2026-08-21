'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Search,
  SearchX,
  Pill,
  X,
  AlertTriangle,
  CircleCheck,
  CircleX,
  Shield,
  FlaskConical,
  Building2,
  Clock,
  Tag,
  ChevronRight,
  Info,
  PackageSearch,
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
  'encyclopedia.title': 'Medicine Encyclopedia',
  'encyclopedia.subtitle': 'Comprehensive medicine information and details',
  'encyclopedia.searchPlaceholder': 'Search medicine name (e.g. Paracetamol, Amoxicillin...)',
  'encyclopedia.search': 'Search',
  'encyclopedia.popular': 'Popular Medicines',
  'encyclopedia.error': 'Failed to search medicine',
  'encyclopedia.noResults.title': 'No Medicine Found',
  'encyclopedia.noResults.desc': 'Try a different medicine name or check spelling',
  'encyclopedia.startSearching': 'Search for any medicine to see detailed information',
  'encyclopedia.genericName': 'Generic Name',
  'encyclopedia.category': 'Category',
  'encyclopedia.uses': 'Uses',
  'encyclopedia.sideEffects': 'Side Effects',
  'encyclopedia.contraindications': 'Contraindications',
  'encyclopedia.pregnancySafety': 'Pregnancy Safety',
  'encyclopedia.howItWorks': 'How It Works',
  'encyclopedia.manufacturers': 'Common Manufacturers',
  'encyclopedia.dosages': 'Common Dosages',
  'encyclopedia.findSubstitutes': 'Find Substitutes',
  'encyclopedia.searchNearby': 'Search Nearby',
  'encyclopedia.disclaimer': 'Medical Disclaimer',
  'encyclopedia.disclaimerText': 'This information is for educational purposes only and should not replace professional medical advice. Always consult your doctor or pharmacist before taking any medication.',
  'encyclopedia.safe': 'Safe',
  'encyclopedia.caution': 'Caution',
  'encyclopedia.unsafe': 'Unsafe',
  'encyclopedia.unknown': 'Unknown',
  'encyclopedia.severity': 'Severity',
  'encyclopedia.mild': 'Mild',
  'encyclopedia.moderate': 'Moderate',
  'encyclopedia.severe': 'Severe',
}

const popularMedicines = [
  'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin',
  'Cetirizine', 'Omeprazole', 'Metformin', 'Aspirin',
  'Dolo 650', 'Crocin', 'Combiflam', 'Pan D',
]

const pregnancySafetyConfig: Record<string, { label: string; color: string }> = {
  safe: { label: 'encyclopedia.safe', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  caution: { label: 'encyclopedia.caution', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  unsafe: { label: 'encyclopedia.unsafe', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  unknown: { label: 'encyclopedia.unknown', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
}

const severityConfig: Record<string, { label: string; color: string }> = {
  mild: { label: 'encyclopedia.mild', color: 'text-amber-600 dark:text-amber-400' },
  moderate: { label: 'encyclopedia.moderate', color: 'text-orange-600 dark:text-orange-400' },
  severe: { label: 'encyclopedia.severe', color: 'text-red-600 dark:text-red-400' },
}

function tf(t: (key: string) => string, key: string): string {
  return fallback[key] || t(key)
}

interface SideEffect {
  name: string
  severity: string
}

interface MedicineInfo {
  id: string
  name: string
  genericName: string
  category: string
  uses: string[]
  sideEffects: SideEffect[]
  contraindications: string[]
  pregnancySafety: string
  howItWorks: string
  manufacturers: string[]
  dosages: string[]
}

export default function MedicineEncyclopediaScreen() {
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)
  const goBack = useAppStore(s => s.goBack)
  const navigate = useAppStore(s => s.navigate)

  const [searchQuery, setSearchQuery] = useState('')
  const [medicine, setMedicine] = useState<MedicineInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [searched, setSearched] = useState(false)

  const searchMedicine = useCallback(async (query?: string) => {
    const q = (query || searchQuery).trim()
    if (!q) return

    setLoading(true)
    setError(false)
    setSearched(true)
    try {
      const res = await fetch(`/api/medicine-info?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const info = data.medicine || data
      if (!info || (!info.name && !info.genericName)) {
        setMedicine(null)
        return
      }
      setMedicine({
        id: info.id || String(Math.random()),
        name: info.name || q,
        genericName: info.genericName || info.generic || '',
        category: info.category || 'General',
        uses: Array.isArray(info.uses) ? info.uses : (typeof info.uses === 'string' ? info.uses.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
        sideEffects: (info.sideEffects || []).map((s: Record<string, unknown> | string) =>
          typeof s === 'string' ? { name: s, severity: 'mild' } : { name: s.name || '', severity: s.severity || 'mild' }
        ),
        contraindications: info.contraindications || info.contraindication || [],
        pregnancySafety: info.pregnancySafety || info.pregnancy || 'unknown',
        howItWorks: info.howItWorks || info.mechanism || '',
        manufacturers: info.manufacturers || [],
        dosages: info.dosages || info.dosage || info.commonDosages || [],
      })
    } catch {
      setError(true)
      toast.error(tf(t, 'encyclopedia.error'))
    } finally {
      setLoading(false)
    }
  }, [searchQuery, t])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchMedicine()
  }

  const handlePopularClick = (name: string) => {
    setSearchQuery(name)
    searchMedicine(name)
  }

  const navigateToSubstitutes = () => {
    if (medicine) {
      useAppStore.getState().setSearchQuery(medicine.name)
      navigate('medicine-substitutes')
    }
  }

  const navigateToSearch = () => {
    if (medicine) {
      useAppStore.getState().setSearchQuery(medicine.name)
      navigate('search')
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Button variant="ghost" size="icon" onClick={goBack} className="flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{tf(t, 'encyclopedia.title')}</h1>
          </div>
        </div>
      </div>

      <p className="px-4 pb-3 text-sm text-muted-foreground">
        {tf(t, 'encyclopedia.subtitle')}
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="px-4 pb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tf(t, 'encyclopedia.searchPlaceholder')}
              className="pl-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setMedicine(null); setSearched(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button type="submit" disabled={loading}>
            {tf(t, 'encyclopedia.search')}
          </Button>
        </div>
      </form>

      {/* Popular Medicines */}
      {!searched && (
        <div className="px-4 pb-3">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">
            {tf(t, 'encyclopedia.popular')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {popularMedicines.map(med => (
              <button
                key={med}
                onClick={() => handlePopularClick(med)}
                className="px-2.5 py-1 text-xs bg-muted rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                {med}
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : !searched ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <div className="rounded-full bg-muted p-6 mb-4">
                <FlaskConical className="h-10 w-10" />
              </div>
              <p className="text-sm text-center">{tf(t, 'encyclopedia.startSearching')}</p>
            </motion.div>
          ) : error || !medicine ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-muted-foreground"
            >
              <div className="rounded-full bg-muted p-4 mb-4">
                <SearchX className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">{tf(t, 'encyclopedia.noResults.title')}</p>
              <p className="text-sm mt-1 text-center">{tf(t, 'encyclopedia.noResults.desc')}</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Name & Generic */}
                <Card className="border-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        <h2 className="text-lg font-bold">{medicine.name}</h2>
                      </div>
                    </div>
                    {medicine.genericName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        <span>{tf(t, 'encyclopedia.genericName')}: {medicine.genericName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{medicine.category}</Badge>
                      {medicine.pregnancySafety && (
                        <Badge className={cn(
                          'text-[10px]',
                          pregnancySafetyConfig[medicine.pregnancySafety]?.color || pregnancySafetyConfig.unknown.color
                        )}>
                          <Shield className="h-2.5 w-2.5 mr-1" />
                          {tf(t, pregnancySafetyConfig[medicine.pregnancySafety]?.label || 'encyclopedia.unknown')}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Uses */}
                {medicine.uses.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <CircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        {tf(t, 'encyclopedia.uses')}
                      </h3>
                      <ul className="space-y-1.5">
                        {medicine.uses.map((use, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            {use}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Side Effects */}
                {medicine.sideEffects.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        {tf(t, 'encyclopedia.sideEffects')}
                      </h3>
                      <div className="space-y-1.5">
                        {medicine.sideEffects.map((se, i) => {
                          const sevConfig = severityConfig[se.severity]
                          return (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="flex items-start gap-2 text-foreground/85">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                {se.name}
                              </span>
                              {sevConfig && (
                                <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4', sevConfig.color)}>
                                  {tf(t, sevConfig.label)}
                                </Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Contraindications */}
                {medicine.contraindications.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <CircleX className="h-4 w-4 text-red-600 dark:text-red-400" />
                        {tf(t, 'encyclopedia.contraindications')}
                      </h3>
                      <ul className="space-y-1.5">
                        {medicine.contraindications.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* How It Works */}
                {medicine.howItWorks && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <FlaskConical className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        {tf(t, 'encyclopedia.howItWorks')}
                      </h3>
                      <p className="text-sm text-foreground/85 leading-relaxed">{medicine.howItWorks}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Manufacturers */}
                {medicine.manufacturers.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {tf(t, 'encyclopedia.manufacturers')}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {medicine.manufacturers.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Dosages */}
                {medicine.dosages.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {tf(t, 'encyclopedia.dosages')}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {medicine.dosages.map((d, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full" onClick={navigateToSubstitutes}>
                    <Pill className="h-4 w-4 mr-1.5" />
                    {tf(t, 'encyclopedia.findSubstitutes')}
                  </Button>
                  <Button className="w-full" onClick={navigateToSearch}>
                    <PackageSearch className="h-4 w-4 mr-1.5" />
                    {tf(t, 'encyclopedia.searchNearby')}
                  </Button>
                </div>

                {/* Medical Disclaimer */}
                <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                          {tf(t, 'encyclopedia.disclaimer')}
                        </h4>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                          {tf(t, 'encyclopedia.disclaimerText')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}