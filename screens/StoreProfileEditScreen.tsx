'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  Clock,
  Loader2,
  Power,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'

// ── Animation helpers ──────────────────────────────────────────────────
const sectionFade = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

// ── Section Header ─────────────────────────────────────────────────────
function SectionHeader({
  title,
  icon: Icon,
}: {
  title: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="size-4 text-muted-foreground" />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────
export default function StoreProfileEditScreen() {
  const { user, storeData, setStoreData, navigate, goBack } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [workingHours, setWorkingHours] = useState('8:00 AM - 10:00 PM')
  const [isOpen, setIsOpen] = useState(true)

  // Fetch store profile if not already loaded
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return
      if (storeData) {
        // Pre-populate from existing store data
        setName(storeData.name || '')
        setPhone(storeData.phone || '')
        setAddress(storeData.address || '')
        setWorkingHours(storeData.workingHours || '8:00 AM - 10:00 PM')
        setIsOpen(storeData.isOpen ?? true)
        setLoading(false)
        setMounted(true)
        return
      }

      try {
        const res = await fetch('/api/store/profile', {
          headers: { 'X-User-Id': user.id },
        })
        if (res.ok) {
          const data = await res.json()
          const store = data.store
          setStoreData(store)
          setName(store.name || '')
          setPhone(store.phone || '')
          setAddress(store.address || '')
          setWorkingHours(store.workingHours || '8:00 AM - 10:00 PM')
          setIsOpen(store.isOpen ?? true)
        } else {
          toast.error(t('storeProfile.toast.loadError'))
        }
      } catch {
        toast.error(t('storeProfile.toast.loadError'))
      } finally {
        setLoading(false)
        setMounted(true)
      }
    }

    fetchProfile()
  }, [user?.id, storeData, setStoreData])

  // Clear error on change
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // ── Validation ─────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = t('storeProfile.validation.nameRequired')
    if (!phone.trim()) newErrors.phone = t('storeProfile.validation.phoneRequired')
    if (!address.trim()) newErrors.address = t('storeProfile.validation.addressRequired')

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!user?.id) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/store/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          workingHours: workingHours.trim(),
          isOpen,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || t('storeProfile.toast.updateError'))
      }

      const data = await res.json()
      setStoreData(data.store)

      toast.success(t('storeProfile.toast.updateSuccess'))
      goBack()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('storeProfile.toast.unknownError'))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <Skeleton className="size-9 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="px-4 pb-8 space-y-6">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  // ── Rendered only after mount to prevent hydration mismatch ──────────
  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-3 px-4 pt-4 pb-2"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('store-dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t('storeProfile.title')}</h1>
          <p className="text-xs text-muted-foreground">
            {t('storeProfile.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* ─── Form ───────────────────────────────────────────────────── */}
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-4 pb-8"
      >
        {/* Store Information */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('storeProfile.storeInfo')} icon={Building2} />
          <Card className="border-neutral-100 shadow-none">
            <CardContent className="p-4 space-y-3">
              {/* Store Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-neutral-700">
                  {t('storeProfile.storeName')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearError('name') }}
                    placeholder={t('storeProfile.storeNamePlaceholder')}
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm shadow-none transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                  />
                </div>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500"
                  >
                    {errors.name}
                  </motion.p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-neutral-700">
                  {t('storeProfile.phone')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); clearError('phone') }}
                    placeholder={t('storeProfile.phonePlaceholder')}
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm shadow-none transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                  />
                </div>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500"
                  >
                    {errors.phone}
                  </motion.p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-medium text-neutral-700">
                  {t('storeProfile.address')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); clearError('address') }}
                    placeholder={t('storeProfile.addressPlaceholder')}
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm shadow-none transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                  />
                </div>
                {errors.address && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500"
                  >
                    {errors.address}
                  </motion.p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hours & Status */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('storeProfile.hoursStatus')} icon={Clock} />
          <Card className="border-neutral-100 shadow-none">
            <CardContent className="p-4 space-y-4">
              {/* Working Hours */}
              <div className="space-y-1.5">
                <Label htmlFor="workingHours" className="text-xs font-medium text-neutral-700">
                  {t('storeProfile.workingHours')}
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="workingHours"
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder={t('storeProfile.workingHoursPlaceholder')}
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm shadow-none transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                  />
                </div>
              </div>

              {/* Is Open Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex size-8 items-center justify-center rounded-lg ${isOpen ? 'bg-emerald-100' : 'bg-neutral-100'}`}>
                    <Power className={`size-4 ${isOpen ? 'text-emerald-700' : 'text-neutral-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('storeProfile.storeStatus')}</p>
                    <p className="text-xs text-muted-foreground">
                      {isOpen ? t('storeProfile.currentlyOpen') : t('storeProfile.storeClosed')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isOpen}
                  onCheckedChange={setIsOpen}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants}>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 gap-2 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('storeProfile.saving')}
              </>
            ) : (
              t('storeProfile.saveBtn')
            )}
          </Button>
        </motion.div>
      </motion.form>
    </div>
  )
}