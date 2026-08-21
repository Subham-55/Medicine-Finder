'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  AlertTriangle,
  Plus,
  X,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Pill,
  Search,
  Loader2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
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
  'interactions.title': 'Drug Interaction Checker',
  'interactions.subtitle': 'Check if your medicines are safe to take together',
  'interactions.addPlaceholder': 'Enter medicine name...',
  'interactions.add': 'Add',
  'interactions.check': 'Check Interactions',
  'interactions.checking': 'Analyzing interactions...',
  'interactions.minMedicines': 'Add at least 2 medicines to check interactions',
  'interactions.empty.title': 'Check Medicine Safety',
  'interactions.empty.desc': 'Add two or more medicines above to check for potential drug interactions and food conflicts.',
  'interactions.error.title': 'Something went wrong',
  'interactions.error.desc': 'Failed to check interactions. Please try again.',
  'interactions.tryAgain': 'Try Again',
  'interactions.overallSafety': 'Overall Safety',
  'interactions.drugInteractions': 'Drug Interactions',
  'interactions.foodConflicts': 'Food Conflicts',
  'interactions.severity': 'Severity',
  'interactions.description': 'Description',
  'interactions.recommendation': 'Recommendation',
  'interactions.pair': 'Interaction Pair',
  'interactions.safe': 'Safe',
  'interactions.mild': 'Mild',
  'interactions.moderate': 'Moderate',
  'interactions.severe': 'Severe',
  'interactions.disclaimer': 'This tool is for informational purposes only and does not replace professional medical advice. Always consult your doctor or pharmacist before starting or changing medications.',
  'interactions.noInteractions': 'No significant interactions found between these medicines.',
  'interactions.noFoodConflicts': 'No known food conflicts for these medicines.',
}

// Types
interface Interaction {
  pair: string
  severity: 'safe' | 'mild' | 'moderate' | 'severe'
  description: string
  recommendation: string
}

interface FoodConflict {
  medicine: string
  food: string
  effect: string
  recommendation: string
}

interface InteractionResult {
  interactions: Interaction[]
  foodConflicts: FoodConflict[]
  disclaimer: string
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof ShieldCheck }> = {
  safe: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-100 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: ShieldCheck,
  },
  mild: {
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Info,
  },
  moderate: {
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-100 dark:bg-orange-950/50',
    border: 'border-orange-200 dark:border-orange-800',
    icon: ShieldAlert,
  },
  severe: {
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-100 dark:bg-red-950/50',
    border: 'border-red-200 dark:border-red-800',
    icon: ShieldX,
  },
}

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
          className="inline-block h-2 w-2 rounded-full bg-amber-500"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

export default function DrugInteractionScreen() {
  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)
  const goBack = useAppStore((s) => s.goBack)

  const st = useCallback(
    (key: string) => {
      const val = t(key)
      return val === key && fallback[key] ? fallback[key] : val
    },
    [t]
  )

  const [medicines, setMedicines] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<InteractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const addMedicine = useCallback(() => {
    const name = input.trim()
    if (!name) return
    if (medicines.some((m) => m.toLowerCase() === name.toLowerCase())) {
      toast.error('This medicine is already in the list')
      return
    }
    if (medicines.length >= 10) {
      toast.error('Maximum 10 medicines at a time')
      return
    }
    setMedicines((prev) => [...prev, name])
    setInput('')
    setResult(null)
  }, [input, medicines])

  const removeMedicine = useCallback((index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index))
    setResult(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addMedicine()
      }
    },
    [addMedicine]
  )

  const handleCheck = useCallback(async () => {
    if (medicines.length < 2) {
      toast.error(st('interactions.minMedicines'))
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setExpandedIndex(null)

    try {
      const res = await fetch('/api/drug-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: InteractionResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast.error(st('interactions.error.title'))
    } finally {
      setIsLoading(false)
    }
  }, [medicines, st])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto w-full">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={goBack} aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="size-5 text-amber-500 shrink-0" />
            <h1 className="text-lg font-bold truncate">{st('interactions.title')}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        {/* Subtitle */}
        <motion.p
          className="text-muted-foreground text-sm mb-6 text-center"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {st('interactions.subtitle')}
        </motion.p>

        {/* Input Area */}
        <motion.div className="mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Pill className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={st('interactions.addPlaceholder')}
                className="pl-10 h-12 text-base"
                disabled={isLoading}
              />
            </div>
            <Button onClick={addMedicine} disabled={!input.trim() || isLoading} variant="outline" className="h-12 px-4 gap-2 shrink-0">
              <Plus className="size-4" />
              <span className="hidden sm:inline">{st('interactions.add')}</span>
            </Button>
          </div>
        </motion.div>

        {/* Medicine Pills */}
        {medicines.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {medicines.map((med, i) => (
                  <motion.div
                    key={`${med}-${i}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-3 py-1.5 text-sm font-medium cursor-default"
                    >
                      <Pill className="size-3.5" />
                      {med}
                      <button
                        onClick={() => removeMedicine(i)}
                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                        aria-label={`Remove ${med}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Check Button */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button
            onClick={handleCheck}
            disabled={medicines.length < 2 || isLoading}
            className="w-full h-12 gap-2 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {st('interactions.checking')}
                <ShimmerDot />
              </>
            ) : (
              <>
                <ShieldAlert className="size-5" />
                {st('interactions.check')}
              </>
            )}
          </Button>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Empty State */}
          {!isLoading && !result && !error && (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-12 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="size-24 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mb-4">
                <ShieldAlert className="size-10 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">{st('interactions.empty.title')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">{st('interactions.empty.desc')}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              key="loading"
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-center gap-2 py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <ShieldAlert className="size-5 text-amber-500" />
                </motion.div>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {st('interactions.checking')}
                </span>
                <ShimmerDot />
              </div>
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
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
            >
              <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="size-10 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">{st('interactions.error.title')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">{st('interactions.error.desc')}</p>
              <Button variant="outline" onClick={handleCheck} className="gap-2">
                <AlertTriangle className="size-4" />
                {st('interactions.tryAgain')}
              </Button>
            </motion.div>
          )}

          {/* Results */}
          {!isLoading && result && (
            <motion.div
              key="results"
              className="space-y-6"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {/* Overall Safety - derived from worst interaction */}
              <motion.div variants={fadeUp} className="flex flex-col items-center py-4">
                {(() => {
                  const severities = ['severe', 'moderate', 'mild', 'safe']
                  const worstSeverity = result.interactions.reduce((worst, int) => {
                    const si = severities.indexOf(int.severity)
                    const wi = severities.indexOf(worst)
                    return si < wi ? int.severity : worst
                  }, 'safe')
                  const cfg = SEVERITY_CONFIG[worstSeverity]
                  const Icon = cfg.icon
                  return (
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${cfg.bg} ${cfg.border}`}>
                      <Icon className={`size-6 ${cfg.color}`} />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{st('interactions.overallSafety')}</p>
                        <p className={`text-lg font-bold ${cfg.color}`}>{st(`interactions.${worstSeverity}`)}</p>
                      </div>
                    </div>
                  )
                })()}
              </motion.div>

              {/* Drug Interactions */}
              <motion.section variants={fadeUp}>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="size-5 text-primary" />
                  <h2 className="text-base font-bold">{st('interactions.drugInteractions')}</h2>
                </div>

                {result.interactions.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ShieldCheck className="size-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{st('interactions.noInteractions')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {result.interactions.map((interaction, i) => {
                      const cfg = SEVERITY_CONFIG[interaction.severity]
                      const Icon = cfg.icon
                      const isExpanded = expandedIndex === i
                      return (
                        <motion.div key={i} variants={fadeUp}>
                          <Card className={`hover:shadow-md transition-shadow border-l-4 ${cfg.border.replace('border-', 'border-l-').replace('border-r', 'border-l')}`}>
                            <CardContent className="p-4 space-y-3">
                              {/* Pair + Severity */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-xs font-medium">{interaction.pair}</Badge>
                                  </div>
                                </div>
                                <Badge className={`shrink-0 gap-1 ${cfg.bg} ${cfg.color} border ${cfg.border} hover:${cfg.bg}`}>
                                  <Icon className="size-3.5" />
                                  {st(`interactions.${interaction.severity}`)}
                                </Badge>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-foreground leading-relaxed">{interaction.description}</p>

                              {/* Expandable Recommendation */}
                              {interaction.recommendation && (
                                <div>
                                  <button
                                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                    {st('interactions.recommendation')}
                                  </button>
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                                          {interaction.recommendation}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </motion.section>

              {/* Food Conflicts */}
              <motion.section variants={fadeUp}>
                <div className="flex items-center gap-2 mb-4">
                  <UtensilsCrossed className="size-5 text-primary" />
                  <h2 className="text-base font-bold">{st('interactions.foodConflicts')}</h2>
                </div>

                {result.foodConflicts.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <UtensilsCrossed className="size-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{st('interactions.noFoodConflicts')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {result.foodConflicts.map((fc, i) => (
                      <motion.div key={i} variants={fadeUp}>
                        <Card>
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline">{fc.medicine}</Badge>
                              <span className="text-muted-foreground text-xs">+</span>
                              <Badge variant="secondary" className="gap-1">
                                <UtensilsCrossed className="size-3" />
                                {fc.food}
                              </Badge>
                            </div>
                            <p className="text-sm">{fc.effect}</p>
                            {fc.recommendation && (
                              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{fc.recommendation}</p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>

              {/* Disclaimer */}
              <motion.div
                variants={fadeUp}
                className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
              >
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
                  {result.disclaimer || st('interactions.disclaimer')}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}