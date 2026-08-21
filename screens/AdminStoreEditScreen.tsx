'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Clock,
  Loader2,
  BadgeCheck,
  BadgeX,
  Save,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// ── Animation helpers ──────────────────────────────────────────────────
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const sectionFade = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ── Section header ─────────────────────────────────────────────────────
function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="size-4 text-muted-foreground" />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
    </div>
  )
}

// ── Form field ─────────────────────────────────────────────────────────
function FormField({
  label,
  name,
  value,
  error,
  onChange,
  icon: Icon,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string
  name: string
  value: string
  error: string
  onChange: (name: string, value: string) => void
  icon: React.ElementType
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs font-medium text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={name}
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm shadow-none transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
        />
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500">
          {error}
        </motion.p>
      )}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────
function EditSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────
export default function AdminStoreEditScreen() {
  const { adminSelectedStoreId, navigate, goBack, setAdminStores } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    // Owner
    ownerName: '',
    ownerEmail: '',
    ownerMobile: '',
    ownerActive: true,
    // Store
    storeName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    licenseNumber: '',
    workingHours: '',
    isOpen: true,
    isActive: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Fetch store details ──────────────────────────────────────────────
  useEffect(() => {
    if (!adminSelectedStoreId) return
    async function fetchStore() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/stores/${adminSelectedStoreId}`)
        if (res.ok) {
          const data = await res.json()
          const s = data.store
          setFormData({
            ownerName: s.owner.name || '',
            ownerEmail: s.owner.email || '',
            ownerMobile: s.owner.mobile || '',
            ownerActive: s.owner.isActive,
            storeName: s.name || '',
            phone: s.phone || '',
            address: s.address || '',
            city: s.city || '',
            state: s.state || '',
            country: s.country || '',
            licenseNumber: s.licenseNumber || '',
            workingHours: s.workingHours || '',
            isOpen: s.isOpen,
            isActive: s.isActive,
          })
        } else {
          toast.error(t('adminEdit.failed.loadStore'))
          goBack()
        }
      } catch {
        toast.error(t('adminEdit.failed.loadStore'))
        goBack()
      } finally {
        setLoading(false)
      }
    }
    fetchStore()
  }, [adminSelectedStoreId, goBack])

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // ── Validation ───────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.ownerName?.trim()) newErrors.ownerName = t('adminEdit.validation.ownerNameRequired')
    if (!formData.ownerEmail?.trim()) newErrors.ownerEmail = t('adminEdit.validation.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail))
      newErrors.ownerEmail = t('adminEdit.validation.emailInvalid')
    if (!formData.storeName?.trim()) newErrors.storeName = t('adminEdit.validation.storeNameRequired')
    if (!formData.phone?.trim()) newErrors.phone = t('adminEdit.validation.phoneRequired')
    if (!formData.address?.trim()) newErrors.address = t('adminEdit.validation.addressRequired')
    if (!formData.city?.trim()) newErrors.city = t('adminEdit.validation.cityRequired')
    if (!formData.state?.trim()) newErrors.state = t('adminEdit.validation.stateRequired')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Save ─────────────────────────────────────────────────────────────
  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate() || !adminSelectedStoreId) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/stores/${adminSelectedStoreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          ownerMobile: formData.ownerMobile || null,
          ownerActive: formData.ownerActive,
          name: formData.storeName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country || 'India',
          licenseNumber: formData.licenseNumber || null,
          workingHours: formData.workingHours || '8:00 AM - 10:00 PM',
          isOpen: formData.isOpen,
          isActive: formData.isActive,
        }),
      })

      if (res.ok) {
        toast.success(t('adminEdit.toast.success'))
        // Refresh admin store list
        try {
          const listRes = await fetch('/api/admin/stores')
          if (listRes.ok) {
            const listData = await listRes.json()
            setAdminStores(listData.stores ?? listData ?? [])
          }
        } catch {
          // non-critical
        }
        goBack()
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || t('adminEdit.toast.failed'))
      }
    } catch {
      toast.error(t('adminEdit.toast.failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <EditSkeleton />

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          {/* ─── Header ────────────────────────────────────────────────── */}
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
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t('adminEdit.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('adminEdit.subtitle')}
              </p>
            </div>
          </motion.div>

          {/* ─── Form ──────────────────────────────────────────────────── */}
          <motion.form
            variants={sectionFade}
            initial="hidden"
            animate="visible"
            onSubmit={handleSave}
            className="space-y-6 pb-6"
          >
            {/* Owner Information */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
              <SectionHeader title={t('adminEdit.ownerInfo')} icon={User} />
              <Card className="border-neutral-100 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <FormField
                    label={t('adminEdit.ownerName')}
                    name="ownerName"
                    value={formData.ownerName}
                    error={errors.ownerName}
                    onChange={handleChange}
                    icon={User}
                    placeholder={t('adminEdit.ownerNamePlaceholder')}
                    required
                  />
                  <FormField
                    label={t('adminEdit.emailAddress')}
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    error={errors.ownerEmail}
                    onChange={handleChange}
                    icon={Mail}
                    type="email"
                    placeholder="owner@example.com"
                    required
                  />
                  <FormField
                    label={t('adminEdit.mobileNumber')}
                    name="ownerMobile"
                    value={formData.ownerMobile}
                    error={errors.ownerMobile}
                    onChange={handleChange}
                    icon={Phone}
                    placeholder="+91 98765 43210"
                  />
                  <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
                    <div className="flex items-center gap-2">
                      {formData.ownerActive ? (
                        <BadgeCheck className="size-4 text-emerald-600" />
                      ) : (
                        <BadgeX className="size-4 text-rose-500" />
                      )}
                      <span className="text-sm font-medium">{t('adminEdit.ownerActive')}</span>
                    </div>
                    <Switch
                      checked={formData.ownerActive}
                      onCheckedChange={(v) =>
                        setFormData((prev) => ({ ...prev, ownerActive: v }))
                      }
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Store Information */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
              <SectionHeader title={t('adminEdit.storeInfo')} icon={Building2} />
              <Card className="border-neutral-100 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <FormField
                    label={t('adminEdit.storeName')}
                    name="storeName"
                    value={formData.storeName}
                    error={errors.storeName}
                    onChange={handleChange}
                    icon={Building2}
                    placeholder={t('adminEdit.storeNamePlaceholder')}
                    required
                  />
                  <FormField
                    label={t('adminEdit.phone')}
                    name="phone"
                    value={formData.phone}
                    error={errors.phone}
                    onChange={handleChange}
                    icon={Phone}
                    placeholder="+91 98765 43210"
                    required
                  />
                  <FormField
                    label={t('adminEdit.licenseNumber')}
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    error={errors.licenseNumber}
                    onChange={handleChange}
                    icon={BadgeCheck}
                    placeholder={t('adminEdit.licensePlaceholder')}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Location */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
              <SectionHeader title={t('adminEdit.location')} icon={MapPin} />
              <Card className="border-neutral-100 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <FormField
                    label={t('adminEdit.address')}
                    name="address"
                    value={formData.address}
                    error={errors.address}
                    onChange={handleChange}
                    icon={MapPin}
                    placeholder={t('adminEdit.addressPlaceholder')}
                    required
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormField
                      label={t('adminEdit.city')}
                      name="city"
                      value={formData.city}
                      error={errors.city}
                      onChange={handleChange}
                      icon={MapPin}
                      placeholder={t('adminEdit.cityPlaceholder')}
                      required
                    />
                    <FormField
                      label={t('adminEdit.state')}
                      name="state"
                      value={formData.state}
                      error={errors.state}
                      onChange={handleChange}
                      icon={MapPin}
                      placeholder={t('adminEdit.statePlaceholder')}
                      required
                    />
                    <FormField
                      label={t('adminEdit.country')}
                      name="country"
                      value={formData.country}
                      error={errors.country}
                      onChange={handleChange}
                      icon={MapPin}
                      placeholder={t('adminEdit.countryPlaceholder')}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Status & Hours */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
              <SectionHeader title={t('adminEdit.statusHours')} icon={Clock} />
              <Card className="border-neutral-100 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <FormField
                    label={t('adminEdit.workingHours')}
                    name="workingHours"
                    value={formData.workingHours}
                    error={errors.workingHours}
                    onChange={handleChange}
                    icon={Clock}
                    placeholder={t('adminEdit.workingHoursPlaceholder')}
                  />
                  <Separator />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          formData.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {formData.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                      <span className="text-sm">{t('adminEdit.storeActive')}</span>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(v) =>
                        setFormData((prev) => ({ ...prev, isActive: v }))
                      }
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          formData.isOpen
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {formData.isOpen ? t('common.open') : t('common.closed')}
                      </Badge>
                      <span className="text-sm">{t('adminEdit.storeOpen')}</span>
                    </div>
                    <Switch
                      checked={formData.isOpen}
                      onCheckedChange={(v) =>
                        setFormData((prev) => ({ ...prev, isOpen: v }))
                      }
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Save button */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
              <Button
                type="submit"
                disabled={saving}
                className="w-full h-11 gap-2 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('adminEdit.saving')}
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {t('adminEdit.saveBtn')}
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </div>
  )
}