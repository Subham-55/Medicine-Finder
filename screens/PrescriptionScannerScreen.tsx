'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanLine,
  Camera,
  Upload,
  Sparkles,
  Pill,
  Search,
  ArrowRightLeft,
  AlertCircle,
  X,
  FileText,
  Stethoscope,
  User,
  Calendar,
  StickyNote,
  Loader2,
  Share2,
  Copy,
  Mail,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────
interface ScannedMedicine {
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
  unclear?: boolean
}

interface ScanResult {
  medicines: ScannedMedicine[]
  doctorName?: string
  patientName?: string
  date?: string
  notes?: string
}

type ScanStep = 'reading' | 'extracting' | 'done'

// ── Helpers ────────────────────────────────────────────
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// ── Dot animation text ────────────────────────────────
function AnimatedDots() {
  const [dots, setDots] = useState('')
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])
  return <span>{dots}</span>
}

// ── Main Component ─────────────────────────────────────
export default function PrescriptionScannerScreen() {
  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)
  const { navigate, setSearchQuery, goBack } = useAppStore()

  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanStep, setScanStep] = useState<ScanStep>('reading')
  const [shareOpen, setShareOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // ── Step progression during scan ────────────────────
  useEffect(() => {
    if (!isScanning) return
    const timers = [
      setTimeout(() => setScanStep('extracting'), 2000),
      setTimeout(() => setScanStep('done'), 4500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [isScanning])

  // ── File handling ───────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setImage(dataUrl)
      setImageFile(file)
      setScanResults(null)
      setError(null)
    } catch {
      toast.error('Failed to read the image file')
    }
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      // Reset so the same file can be re-selected
      e.target.value = ''
    },
    [handleFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const clearImage = useCallback(() => {
    setImage(null)
    setImageFile(null)
    setScanResults(null)
    setError(null)
    setScanStep('reading')
  }, [])

  // ── Scan API call ───────────────────────────────────
  const handleScan = useCallback(async () => {
    if (!image) return
    setIsScanning(true)
    setError(null)
    setScanResults(null)
    setScanStep('reading')

    try {
      const res = await fetch('/api/scan-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Scan failed')
      }

      if (data.medicines && data.medicines.length > 0) {
        setScanResults(data)
      } else {
        setScanResults(data) // still show the result for no-meds state
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('scanner.error.desc')
      setError(msg)
      toast.error(t('scanner.error.title'), { description: msg })
    } finally {
      setIsScanning(false)
      setScanStep('reading')
    }
  }, [image, t])

  // ── Navigation helpers ──────────────────────────────
  const handleSearchMedicine = useCallback(
    (name: string) => {
      setSearchQuery(name)
      navigate('search-results')
    },
    [setSearchQuery, navigate],
  )

  const handleFindSubstitutes = useCallback(
    (name: string) => {
      setSearchQuery(name)
      navigate('medicine-substitutes')
    },
    [setSearchQuery, navigate],
  )

  const handleSearchAll = useCallback(() => {
    if (scanResults?.medicines?.[0]?.name) {
      handleSearchMedicine(scanResults.medicines[0].name)
    }
  }, [scanResults, handleSearchMedicine])

  const handleSubstitutesAll = useCallback(() => {
    if (scanResults?.medicines?.[0]?.name) {
      handleFindSubstitutes(scanResults.medicines[0].name)
    }
  }, [scanResults, handleFindSubstitutes])

  // ── Share helpers ─────────────────────────────────
  const buildShareText = useCallback(() => {
    if (!scanResults) return ''
    let text = '📋 Prescription Details\n'
    if (scanResults.patientName) text += `Patient: ${scanResults.patientName}\n`
    if (scanResults.doctorName) text += `Doctor: ${scanResults.doctorName}\n`
    if (scanResults.date) text += `Date: ${scanResults.date}\n`
    text += '\n💊 Medicines:\n'
    scanResults.medicines.forEach((med, i) => {
      text += `${i + 1}. ${med.name}`
      if (med.dosage) text += ` - ${med.dosage}`
      if (med.frequency) text += `, ${med.frequency}`
      if (med.duration) text += `, ${med.duration}`
      text += '\n'
    })
    text += '\n— Shared via Medicine Finder'
    return text
  }, [scanResults])

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildShareText())
      toast.success('Prescription copied to clipboard')
      setShareOpen(false)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }, [buildShareText])

  const handleShareEmail = useCallback(() => {
    const subject = encodeURIComponent('Prescription Details')
    const body = encodeURIComponent(buildShareText())
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self')
    setShareOpen(false)
  }, [buildShareText])

  const handleShareSMS = useCallback(() => {
    const body = encodeURIComponent(buildShareText())
    window.open(`sms:?body=${body}`, '_self')
    setShareOpen(false)
  }, [buildShareText])

  // ── Scan step labels ────────────────────────────────
  const stepLabels: Record<ScanStep, string> = {
    reading: t('scanner.step.reading'),
    extracting: t('scanner.step.extracting'),
    done: t('scanner.step.done'),
  }

  // ── Determine what to render ────────────────────────
  const showEmpty = !image && !scanResults && !isScanning
  const showPreview = image && !scanResults && !isScanning
  const showScanning = image && isScanning
  const showResults = scanResults && !isScanning

  // ────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={goBack}
            aria-label={t('common.back')}
          >
            <X className="size-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ScanLine className="size-5 text-primary shrink-0" />
              <h1 className="text-lg font-semibold truncate">
                {t('scanner.title')}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {t('scanner.subtitle')}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1 shrink-0">
            <Sparkles className="size-3 text-amber-500" />
            AI
          </Badge>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-28">
        <AnimatePresence mode="wait">
          {/* ── Empty / Upload State ── */}
          {showEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center pt-12 sm:pt-20"
            >
              {/* Large icon */}
              <div className="relative mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/10 flex items-center justify-center">
                  <ScanLine className="size-12 sm:size-14 text-primary" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="size-3.5 text-white" />
                </motion.div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
                {t('scanner.uploadTitle')}
              </h2>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
                {t('scanner.uploadDesc')}
              </p>

              {/* Upload Drop Zone */}
              <div
                role="button"
                tabIndex={0}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                className={`
                  w-full max-w-md aspect-[4/3] rounded-2xl border-2 border-dashed
                  flex flex-col items-center justify-center gap-3 cursor-pointer
                  transition-all duration-200
                  bg-gradient-to-br from-primary/5 via-background to-primary/5
                  ${isDragging
                    ? 'border-primary bg-primary/10 scale-[1.02]'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="size-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">
                    {t('scanner.tapToCapture')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('scanner.orUpload')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                  <Upload className="size-3" />
                  {t('scanner.supportedFormats')}
                </div>
              </div>

              {/* Hidden inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInput}
                className="hidden"
              />

              {/* Quick Camera Button */}
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  cameraInputRef.current?.click()
                }}
              >
                <Camera className="size-4" />
                {t('scanner.tapToCapture')}
              </Button>
            </motion.div>
          )}

          {/* ── Image Preview (not scanning) ── */}
          {showPreview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="pt-4 sm:pt-6"
            >
              {/* Image Frame */}
              <div className="relative rounded-2xl overflow-hidden border bg-muted shadow-sm">
                <img
                  src={image!}
                  alt="Prescription preview"
                  className="w-full h-auto max-h-[50vh] object-contain bg-black/5"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <Button
                  size="lg"
                  className="gap-2 h-12 text-base font-semibold"
                  onClick={handleScan}
                >
                  <Sparkles className="size-5" />
                  {t('scanner.scanBtn')}
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="size-4" />
                    {t('scanner.changeImage')}
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground"
                    onClick={clearImage}
                  >
                    <X className="size-4" />
                    {t('scanner.clear')}
                  </Button>
                </div>
              </div>

              {/* Hidden inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInput}
                className="hidden"
              />
            </motion.div>
          )}

          {/* ── Scanning State ── */}
          {showScanning && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="pt-4 sm:pt-6"
            >
              {/* Image with scanning overlay */}
              <div className="relative rounded-2xl overflow-hidden border bg-muted shadow-sm">
                <img
                  src={image!}
                  alt="Scanning prescription"
                  className="w-full h-auto max-h-[50vh] object-contain bg-black/5"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/20" />
                {/* Scanning line */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_2px_rgba(var(--primary),0.5)]"
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                {/* Glow band around the line */}
                <motion.div
                  className="absolute left-0 right-0 h-16 bg-gradient-to-b from-primary/10 via-primary/20 to-primary/10 pointer-events-none"
                  initial={{ top: '-8%' }}
                  animate={{ top: ['-8%', '92%', '-8%'] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              {/* Scanning progress */}
              <div className="mt-6 flex flex-col items-center gap-4">
                <motion.div
                  className="flex items-center gap-2 text-primary font-semibold"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-base">
                    {t('scanner.scanning')}
                    <AnimatedDots />
                  </span>
                </motion.div>

                {/* Step indicators */}
                <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                  {(['reading', 'extracting', 'done'] as ScanStep[]).map(
                    (step, idx) => {
                      const stepOrder = ['reading', 'extracting', 'done']
                      const currentIdx = stepOrder.indexOf(scanStep)
                      const isActive = idx === currentIdx
                      const isCompleted = idx < currentIdx

                      return (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.15 }}
                          className="flex items-center gap-2.5 w-full"
                        >
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${
                              isCompleted
                                ? 'bg-green-500'
                                : isActive
                                  ? 'bg-primary animate-pulse'
                                  : 'bg-muted-foreground/25'
                            }`}
                          />
                          <span
                            className={`text-sm transition-colors duration-300 ${
                              isCompleted
                                ? 'text-green-600 dark:text-green-400'
                                : isActive
                                  ? 'text-foreground font-medium'
                                  : 'text-muted-foreground/50'
                            }`}
                          >
                            {stepLabels[step]}
                          </span>
                          {isCompleted && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-green-600 dark:text-green-400 text-xs"
                            >
                              ✓
                            </motion.span>
                          )}
                        </motion.div>
                      )
                    },
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Results State ── */}
          {showResults && scanResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="pt-4 sm:pt-6"
            >
              {/* ── No Medicines Found ── */}
              {!scanResults.medicines || scanResults.medicines.length === 0 ? (
                <div className="flex flex-col items-center pt-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertCircle className="size-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {t('scanner.noMedsFound')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    {t('scanner.noMedsFoundDesc')}
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={clearImage}>
                      {t('scanner.changeImage')}
                    </Button>
                    <Button onClick={handleScan}>
                      {t('scanner.tryAgain')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Error Banner ── */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
                    >
                      <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-destructive">
                          {t('scanner.error.title')}
                        </p>
                        <p className="text-xs text-destructive/80 mt-0.5">
                          {error}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-7 w-7"
                        onClick={() => setError(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </motion.div>
                  )}

                  {/* ── Summary Bar ── */}
                  <Card className="py-4 mb-4">
                    <CardContent className="px-4 py-0">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-1.5">
                          <Pill className="size-4 text-primary" />
                          <span className="font-semibold text-sm">
                            {t('scanner.medicinesFound', {
                              count: scanResults.medicines.length,
                            })}
                          </span>
                        </div>
                        {scanResults.doctorName && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Stethoscope className="size-3" />
                            <span className="truncate max-w-[150px]">
                              {scanResults.doctorName}
                            </span>
                          </div>
                        )}
                        {scanResults.date && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            <span>{scanResults.date}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* ── Prescription Metadata ── */}
                  {(scanResults.doctorName ||
                    scanResults.patientName ||
                    scanResults.date ||
                    scanResults.notes) && (
                    <Card className="py-4 mb-4">
                      <CardContent className="px-4 py-0">
                        <div className="grid grid-cols-2 gap-3">
                          {scanResults.doctorName && (
                            <div className="flex items-start gap-2">
                              <Stethoscope className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                  {t('scanner.doctor')}
                                </p>
                                <p className="text-xs font-medium truncate">
                                  {scanResults.doctorName}
                                </p>
                              </div>
                            </div>
                          )}
                          {scanResults.patientName && (
                            <div className="flex items-start gap-2">
                              <User className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                  {t('scanner.patient')}
                                </p>
                                <p className="text-xs font-medium truncate">
                                  {scanResults.patientName}
                                </p>
                              </div>
                            </div>
                          )}
                          {scanResults.date && (
                            <div className="flex items-start gap-2">
                              <Calendar className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                  {t('scanner.date')}
                                </p>
                                <p className="text-xs font-medium">
                                  {scanResults.date}
                                </p>
                              </div>
                            </div>
                          )}
                          {scanResults.notes && (
                            <div className="flex items-start gap-2 col-span-2">
                              <StickyNote className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                  {t('scanner.notes')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {scanResults.notes}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* ── Disclaimer ── */}
                  <div className="flex items-start gap-2 mb-4 px-1">
                    <AlertCircle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('scanner.disclaimer')}
                    </p>
                  </div>

                  {/* ── Medicines List ── */}
                  <div className="space-y-3 mb-4">
                    {scanResults.medicines.map((med, idx) => (
                      <MedicineCard
                        key={med.name + idx}
                        medicine={med}
                        index={idx}
                        onSearch={() => handleSearchMedicine(med.name)}
                        onSubstitutes={() => handleFindSubstitutes(med.name)}
                        t={t}
                      />
                    ))}
                  </div>

                  {/* ── Share Prescription ── */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-11 rounded-xl text-sm font-medium"
                      onClick={() => setShareOpen((v) => !v)}
                    >
                      <Share2 className="size-4" />
                      Share Prescription
                    </Button>
                    <AnimatePresence>
                      {shareOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -8, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-2 mt-2">
                            <Button
                              variant="outline"
                              className="justify-start gap-3 h-10 rounded-lg text-sm"
                              onClick={handleCopyToClipboard}
                            >
                              <Copy className="size-4 text-muted-foreground" />
                              Copy to Clipboard
                            </Button>
                            <Button
                              variant="outline"
                              className="justify-start gap-3 h-10 rounded-lg text-sm"
                              onClick={handleShareEmail}
                            >
                              <Mail className="size-4 text-muted-foreground" />
                              Share via Email
                            </Button>
                            <Button
                              variant="outline"
                              className="justify-start gap-3 h-10 rounded-lg text-sm"
                              onClick={handleShareSMS}
                            >
                              <MessageSquare className="size-4 text-muted-foreground" />
                              Share via SMS
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Sticky Bottom Action Bar (results only) ── */}
      <AnimatePresence>
        {showResults && scanResults && scanResults.medicines.length > 0 && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-md border-t"
          >
            <div className="max-w-2xl mx-auto px-4 py-3 flex gap-3">
              <Button
                className="flex-1 gap-2 h-11 font-semibold"
                onClick={handleSearchAll}
              >
                <Search className="size-4" />
                {t('scanner.searchAll')}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 h-11"
                onClick={handleSubstitutesAll}
              >
                <ArrowRightLeft className="size-4" />
                {t('scanner.findSubstitutes')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Medicine Card Sub-component ───────────────────────
function MedicineCard({
  medicine,
  index,
  onSearch,
  onSubstitutes,
  t,
}: {
  medicine: ScannedMedicine
  index: number
  onSearch: () => void
  onSubstitutes: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const details = [
    { label: t('scanner.dosage'), value: medicine.dosage },
    { label: t('scanner.frequency'), value: medicine.frequency },
    { label: t('scanner.duration'), value: medicine.duration },
    { label: t('scanner.instructions'), value: medicine.instructions },
  ].filter((d) => d.value && d.value !== 'Not specified')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
    >
      <Card className="py-4">
        <CardContent className="px-4 py-0">
          {/* Medicine Name */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Pill className="size-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight">
                {medicine.name}
              </h3>
              {medicine.unclear && (
                <Badge variant="outline" className="mt-1 text-[10px]">
                  AI guess
                </Badge>
              )}
            </div>
          </div>

          {/* Details Grid */}
          {details.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3 pl-12">
                {details.map((detail) => (
                  <div key={detail.label}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {detail.label}
                    </p>
                    <p className="text-sm font-medium mt-0.5 capitalize">
                      {detail.value}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="mb-3" />
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pl-12">
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs font-medium"
              onClick={onSearch}
            >
              <Search className="size-3.5" />
              {t('scanner.searchMedicine')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={onSubstitutes}
            >
              <ArrowRightLeft className="size-3.5" />
              {t('scanner.findSubstitutes')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}