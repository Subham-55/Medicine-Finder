'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calculator,
  Pill,
  User,
  Baby,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  Weight,
  Calendar,
  ShieldAlert,
  Sparkles,
  Activity,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'dosage.title': 'Dosage Calculator',
  'dosage.subtitle': 'Calculate safe medicine dosages for adults, children, and elderly',
  'dosage.medicineName': 'Medicine Name',
  'dosage.medicinePlaceholder': 'e.g. Paracetamol, Amoxicillin...',
  'dosage.patientType': 'Patient Type',
  'dosage.adult': 'Adult',
  'dosage.pediatric': 'Pediatric',
  'dosage.elderly': 'Elderly',
  'dosage.age': 'Age',
  'dosage.agePlaceholder': 'Enter age',
  'dosage.weight': 'Weight (kg)',
  'dosage.weightPlaceholder': 'e.g. 70',
  'dosage.gender': 'Gender',
  'dosage.male': 'Male',
  'dosage.female': 'Female',
  'dosage.calculate': 'Calculate Dosage',
  'dosage.calculating': 'Calculating safe dosage...',
  'dosage.recommendedDose': 'Recommended Dose',
  'dosage.frequency': 'Frequency',
  'dosage.maxDailyDose': 'Maximum Daily Dose',
  'dosage.duration': 'Duration',
  'dosage.specialNotes': 'Special Notes',
  'dosage.warnings': 'Warnings',
  'dosage.dosageTimeline': 'Dosage Timeline',
  'dosage.empty.title': 'Calculate Safe Dosages',
  'dosage.empty.desc': 'Enter a medicine name and patient details above to get a personalized dosage recommendation.',
  'dosage.error.title': 'Something went wrong',
  'dosage.error.desc': 'Failed to calculate dosage. Please try again.',
  'dosage.tryAgain': 'Try Again',
  'dosage.disclaimer': 'This calculator provides general dosage estimates only. Always follow your doctor\'s prescription. Dosages may vary based on individual health conditions, allergies, and other medications.',
  'dosage.perDose': 'per dose',
  'dosage.perDay': 'per day',
  'dosage.days': 'days',
  'dosage.provideAll': 'Please fill in medicine name, age, and weight',
}

// Types
type PatientType = 'adult' | 'pediatric' | 'elderly'

interface DosageResult {
  medicineName?: string
  recommendedDose: string
  frequency: string
  maxDailyDose: string
  duration: string
  notes: string
  warnings: string[]
  disclaimer: string
}

const PATIENT_TYPES: { value: PatientType; label: string; icon: typeof User }[] = [
  { value: 'adult', label: 'Adult', icon: User },
  { value: 'pediatric', label: 'Pediatric', icon: Baby },
  { value: 'elderly', label: 'Elderly', icon: User },
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
          className="inline-block h-2 w-2 rounded-full bg-teal-500"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

export default function DosageCalculatorScreen() {
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

  const [medicineName, setMedicineName] = useState('')
  const [patientType, setPatientType] = useState<PatientType>('adult')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DosageResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = useCallback(async () => {
    if (!medicineName.trim() || !age.trim() || !weight.trim()) {
      toast.error(st('dosage.provideAll'))
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/dosage-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineName: medicineName.trim(),
          patientType,
          age: parseInt(age, 10),
          weight: parseFloat(weight),
          gender: gender || undefined,
        }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: DosageResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast.error(st('dosage.error.title'))
    } finally {
      setIsLoading(false)
    }
  }, [medicineName, patientType, age, weight, gender, st])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleCalculate()
      }
    },
    [handleCalculate]
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
            <Calculator className="size-5 text-teal-500 shrink-0" />
            <h1 className="text-lg font-bold truncate">{st('dosage.title')}</h1>
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
          {st('dosage.subtitle')}
        </motion.p>

        {/* Form Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-8">
            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Medicine Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{st('dosage.medicineName')}</Label>
                <div className="relative">
                  <Pill className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={st('dosage.medicinePlaceholder')}
                    className="pl-10 h-11 text-base"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Patient Type Tabs */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{st('dosage.patientType')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PATIENT_TYPES.map((pt) => {
                    const Icon = pt.icon
                    const isActive = patientType === pt.value
                    return (
                      <motion.button
                        key={pt.value}
                        onClick={() => setPatientType(pt.value)}
                        className={`flex items-center justify-center gap-2 h-11 rounded-lg border-2 text-sm font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                      >
                        <Icon className="size-4" />
                        {pt.label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Age & Weight Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{st('dosage.age')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder={st('dosage.agePlaceholder')}
                      className="pl-10 h-11"
                      min={0}
                      max={120}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{st('dosage.weight')} (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder={st('dosage.weightPlaceholder')}
                      className="pl-10 h-11"
                      min={1}
                      max={300}
                      step="0.1"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Gender Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{st('dosage.gender')}</Label>
                <div className="flex gap-3">
                  {['male', 'female'].map((g) => (
                    <Button
                      key={g}
                      variant={gender === g ? 'default' : 'outline'}
                      className="flex-1 gap-2 h-10 capitalize"
                      onClick={() => setGender(gender === g ? '' : g)}
                      disabled={isLoading}
                    >
                      {g === 'male' ? '♂' : '♀'}
                      {st(`dosage.${g}`)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Calculate Button */}
              <Button
                onClick={handleCalculate}
                disabled={!medicineName.trim() || !age.trim() || !weight.trim() || isLoading}
                className="w-full h-12 gap-2 text-base bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    {st('dosage.calculating')}
                    <ShimmerDot />
                  </>
                ) : (
                  <>
                    <Calculator className="size-5" />
                    {st('dosage.calculate')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
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
              <div className="size-24 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center mb-4">
                <Calculator className="size-10 text-teal-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">{st('dosage.empty.title')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">{st('dosage.empty.desc')}</p>
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
                  <Calculator className="size-5 text-teal-500" />
                </motion.div>
                <span className="text-teal-600 dark:text-teal-400 font-medium">{st('dosage.calculating')}</span>
                <ShimmerDot />
              </div>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </CardContent>
              </Card>
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
              <h3 className="text-xl font-bold mb-2">{st('dosage.error.title')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">{st('dosage.error.desc')}</p>
              <Button variant="outline" onClick={handleCalculate} className="gap-2">
                <AlertTriangle className="size-4" />
                {st('dosage.tryAgain')}
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
              {/* Main Result Card */}
              <motion.div variants={fadeUp}>
                <Card className="border-2 border-teal-300 dark:border-teal-700 overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/5 via-transparent to-teal-500/5 pointer-events-none" />
                  <CardContent className="relative p-4 sm:p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-5 text-teal-600 dark:text-teal-400" />
                      <h2 className="text-lg font-bold">{st('dosage.recommendedDose')}</h2>
                    </div>

                    {/* Recommended Dose - Big */}
                    <div className="text-center py-3">
                      <p className="text-3xl sm:text-4xl font-bold text-primary">{result.recommendedDose}</p>
                      <p className="text-sm text-muted-foreground mt-1">{st('dosage.perDose')}</p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 text-center space-y-1">
                        <Clock className="size-4 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{st('dosage.frequency')}</p>
                        <p className="text-sm font-semibold">{result.frequency}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center space-y-1">
                        <Activity className="size-4 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{st('dosage.maxDailyDose')}</p>
                        <p className="text-sm font-semibold">{result.maxDailyDose}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center space-y-1 col-span-2 sm:col-span-1">
                        <Calendar className="size-4 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{st('dosage.duration')}</p>
                        <p className="text-sm font-semibold">{result.duration}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notes */}
              {result.notes && (
                <motion.section variants={fadeUp}>
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="size-5 text-primary" />
                    <h2 className="text-base font-bold">{st('dosage.specialNotes')}</h2>
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{result.notes}</p>
                    </CardContent>
                  </Card>
                </motion.section>
              )}

              {/* Warnings */}
              {result.warnings && result.warnings.length > 0 && (
                <motion.section variants={fadeUp}>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="size-5 text-amber-500" />
                    <h2 className="text-base font-bold">{st('dosage.warnings')}</h2>
                  </div>
                  <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="p-4 space-y-2">
                      {result.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
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
                  {result.disclaimer || st('dosage.disclaimer')}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}