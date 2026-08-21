'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Stethoscope,
  Plus,
  X,
  Search,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Pill,
  Thermometer,
  User,
  Activity,
  Heart,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'symptom.title': 'Symptom Checker',
  'symptom.subtitle': 'Describe your symptoms and get AI-powered health insights',
  'symptom.symptomInput': 'Enter a symptom',
  'symptom.add': 'Add',
  'symptom.analyze': 'Analyze Symptoms',
  'symptom.analyzing': 'AI is analyzing your symptoms',
  'symptom.age': 'Age',
  'symptom.agePlaceholder': 'e.g. 30',
  'symptom.gender': 'Gender',
  'symptom.male': 'Male',
  'symptom.female': 'Female',
  'symptom.other': 'Other',
  'symptom.empty.title': 'How Are You Feeling?',
  'symptom.empty.desc': 'Add your symptoms above and let our AI help identify possible conditions.',
  'symptom.error.title': 'Something went wrong',
  'symptom.error.desc': 'Failed to analyze symptoms. Please try again.',
  'symptom.tryAgain': 'Try Again',
  'symptom.possibleConditions': 'Possible Conditions',
  'symptom.recommendedMeds': 'Recommended OTC Medicines',
  'symptom.whenToSeeDoctor': 'When to See a Doctor',
  'symptom.healthAdvice': 'General Health Advice',
  'symptom.probability': 'Probability',
  'symptom.description': 'Description',
  'symptom.disclaimer': 'This tool is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for proper diagnosis and treatment. Do not self-medicate based on these results.',
  'symptom.noSymptoms': 'Please add at least one symptom to analyze',
  'symptom.searchMedicine': 'Search this medicine',
  'symptom.minSymptoms': 'Add at least one symptom to continue',
  'symptom.severeWarning': 'Seek immediate medical attention if you experience severe symptoms like chest pain, difficulty breathing, or sudden weakness.',
}

// Types
interface Condition {
  condition: string
  probability: 'high' | 'medium' | 'low'
  description: string
  recommendedOTC: string | null
  whenToSeeDoctor: string
}

interface SymptomResult {
  possibleConditions: Condition[]
  generalAdvice: string
  disclaimer: string
}

const QUICK_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Sore throat', 'Fatigue',
  'Nausea', 'Body ache', 'Stomach pain', 'Dizziness', 'Rash',
]

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
          className="inline-block h-2 w-2 rounded-full bg-emerald-500"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

function getProbabilityColor(prob: string): string {
  if (prob === 'high') return 'bg-emerald-500'
  if (prob === 'medium') return 'bg-amber-500'
  return 'bg-orange-500'
}

function getProbabilityPercent(prob: string): number {
  if (prob === 'high') return 80
  if (prob === 'medium') return 55
  return 30
}

export default function SymptomCheckerScreen() {
  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)
  const goBack = useAppStore((s) => s.goBack)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const navigate = useAppStore((s) => s.navigate)

  const st = useCallback(
    (key: string) => {
      const val = t(key)
      return val === key && fallback[key] ? fallback[key] : val
    },
    [t]
  )

  const [symptoms, setSymptoms] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SymptomResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedCondition, setExpandedCondition] = useState<number | null>(null)

  const addSymptom = useCallback((value?: string) => {
    const name = (value || input).trim()
    if (!name) return
    if (symptoms.some((s) => s.toLowerCase() === name.toLowerCase())) {
      toast.error('This symptom is already added')
      return
    }
    if (symptoms.length >= 10) {
      toast.error('Maximum 10 symptoms at a time')
      return
    }
    setSymptoms((prev) => [...prev, name])
    setInput('')
    setResult(null)
  }, [input, symptoms])

  const removeSymptom = useCallback((index: number) => {
    setSymptoms((prev) => prev.filter((_, i) => i !== index))
    setResult(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addSymptom()
      }
    },
    [addSymptom]
  )

  const handleAnalyze = useCallback(async () => {
    if (symptoms.length < 1) {
      toast.error(st('symptom.minSymptoms'))
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setExpandedCondition(null)

    try {
      const res = await fetch('/api/symptom-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          age: age ? parseInt(age, 10) : undefined,
          gender: gender || undefined,
        }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: SymptomResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast.error(st('symptom.error.title'))
    } finally {
      setIsLoading(false)
    }
  }, [symptoms, age, gender, st])

  const handleSearchMedicine = useCallback(
    (name: string) => {
      setSearchQuery(name)
      navigate('search-results')
    },
    [setSearchQuery, navigate]
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto w-full">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={goBack} aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Stethoscope className="size-5 text-emerald-500 shrink-0" />
            <h1 className="text-lg font-bold truncate">{st('symptom.title')}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        {/* AI Badge */}
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              AI-Powered
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{st('symptom.subtitle')}</p>
        </motion.div>

        {/* Symptom Input */}
        <motion.div className="mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={st('symptom.symptomInput')}
                className="pl-10 h-12 text-base"
                disabled={isLoading}
              />
            </div>
            <Button onClick={() => addSymptom()} disabled={!input.trim() || isLoading} variant="outline" className="h-12 px-4 gap-2 shrink-0">
              <Plus className="size-4" />
              <span className="hidden sm:inline">{st('symptom.add')}</span>
            </Button>
          </div>
        </motion.div>

        {/* Symptom Chips */}
        {symptoms.length > 0 && (
          <motion.div className="mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {symptoms.map((sym, i) => (
                  <motion.div
                    key={`${sym}-${i}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-medium">
                      <Activity className="size-3.5" />
                      {sym}
                      <button
                        onClick={() => removeSymptom(i)}
                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                        aria-label={`Remove ${sym}`}
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

        {/* Age & Gender Row */}
        <motion.div className="grid grid-cols-2 gap-3 mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="space-y-1.5">
            <Label className="text-xs">{st('symptom.age')}</Label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={st('symptom.agePlaceholder')}
              min={0}
              max={120}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{st('symptom.gender')}</Label>
            <div className="flex gap-2">
              {['male', 'female', 'other'].map((g) => (
                <Button
                  key={g}
                  variant={gender === g ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs h-9 capitalize"
                  onClick={() => setGender(gender === g ? '' : g)}
                  disabled={isLoading}
                >
                  {g === 'male' ? '♂' : g === 'female' ? '♀' : '⚧'}
                  <span className="ml-1">{st(`symptom.${g}`)}</span>
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Symptoms */}
        {!result && !isLoading && !error && (
          <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Common Symptoms</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SYMPTOMS.filter((s) => !symptoms.some((existing) => existing.toLowerCase() === s.toLowerCase())).map((sym) => (
                <motion.button
                  key={sym}
                  onClick={() => addSymptom(sym)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-emerald-100 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus className="size-3" />
                  {sym}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analyze Button */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button
            onClick={handleAnalyze}
            disabled={symptoms.length < 1 || isLoading}
            className="w-full h-12 gap-2 text-base bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {st('symptom.analyzing')}
                <ShimmerDot />
              </>
            ) : (
              <>
                <Sparkles className="size-5" />
                {st('symptom.analyze')}
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
              <div className="size-24 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
                <Stethoscope className="size-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">{st('symptom.empty.title')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">{st('symptom.empty.desc')}</p>
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
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                  <Sparkles className="size-5 text-emerald-500" />
                </motion.div>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{st('symptom.analyzing')}</span>
                <ShimmerDot />
              </div>
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-6 w-14 rounded-full" />
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
              <h3 className="text-xl font-bold mb-2">{st('symptom.error.title')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">{st('symptom.error.desc')}</p>
              <Button variant="outline" onClick={handleAnalyze} className="gap-2">
                <AlertTriangle className="size-4" />
                {st('symptom.tryAgain')}
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
              {/* Possible Conditions */}
              <motion.section variants={fadeUp}>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="size-5 text-primary" />
                  <h2 className="text-base font-bold">{st('symptom.possibleConditions')}</h2>
                  <Badge variant="secondary" className="ml-auto">{result.possibleConditions.length}</Badge>
                </div>

                <div className="space-y-3">
                  {result.possibleConditions.map((cond, i) => {
                    const isExpanded = expandedCondition === i
                    return (
                      <motion.div key={i} variants={fadeUp}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            {/* Name + Probability */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-bold text-base truncate">{cond.condition}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{cond.description}</p>
                              </div>
                              <Badge variant="outline" className="shrink-0 gap-1.5 capitalize">
                                {cond.probability}
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getProbabilityColor(cond.probability) }} />
                              </Badge>
                            </div>

                            {/* Probability Bar */}
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${getProbabilityColor(cond.probability)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${getProbabilityPercent(cond.probability)}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                              />
                            </div>

                            {/* Recommended OTC Medicine */}
                            {cond.recommendedOTC && (
                              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 text-sm">
                                <div className="min-w-0">
                                  <span className="text-xs text-muted-foreground">OTC: </span>
                                  <span className="font-medium">{cond.recommendedOTC}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0 gap-1 text-xs h-7"
                                  onClick={() => handleSearchMedicine(cond.recommendedOTC!)}
                                >
                                  <Search className="size-3" />
                                  {st('symptom.searchMedicine')}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>

              {/* When to See a Doctor - shown per condition */}
              {result.possibleConditions.some(c => c.whenToSeeDoctor) && (
                <motion.section variants={fadeUp}>
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="size-5 text-red-500" />
                    <h2 className="text-base font-bold">{st('symptom.whenToSeeDoctor')}</h2>
                  </div>
                  <Card className="border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
                    <CardContent className="p-4 space-y-2">
                      {result.possibleConditions.filter(c => c.whenToSeeDoctor).map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <ShieldAlert className="size-4 text-red-500 shrink-0 mt-0.5" />
                          <span><strong>{c.condition}:</strong> {c.whenToSeeDoctor}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.section>
              )}

              {/* General Health Advice */}
              {result.generalAdvice && (
                <motion.section variants={fadeUp}>
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="size-5 text-primary" />
                    <h2 className="text-base font-bold">{st('symptom.healthAdvice')}</h2>
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{result.generalAdvice}</p>
                    </CardContent>
                  </Card>
                </motion.section>
              )}

              {/* Disclaimer */}
              <motion.div
                variants={fadeUp}
                className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
              >
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
                  {result.disclaimer || st('symptom.disclaimer')}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}