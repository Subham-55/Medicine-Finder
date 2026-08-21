'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  MapPin,
  Clock,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'

// ── Animation helpers ──────────────────────────────────────────────────
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

// ── Field config ───────────────────────────────────────────────────────
interface FieldConfig {
  name: string
  label: string
  type: string
  placeholder: string
  icon: React.ElementType
  required?: boolean
  defaultValue?: string
}

// ── Form Field Component ───────────────────────────────────────────────
function FormField({
  config,
  value,
  error,
  onChange,
}: {
  config: FieldConfig
  value: string
  error: string
  onChange: (name: string, value: string) => void
}) {
  const Icon = config.icon
  return (
    <div className="space-y-1.5">
      <Label htmlFor={config.name} className="text-xs font-medium text-neutral-700">
        {config.label}
        {config.name !== 'workingHours' && config.name !== 'country' && (
          <span className="ml-0.5 text-red-500">*</span>
        )}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={config.name}
          type={config.type}
          value={value}
          onChange={(e) => onChange(config.name, e.target.value)}
          placeholder={config.placeholder}
          className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm shadow-none transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
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
export default function AdminStoreCreateScreen() {
  const { navigate, setAdminStores } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const ownerFields: FieldConfig[] = [
    {
      name: 'ownerName',
      label: t('adminCreate.ownerName'),
      type: 'text',
      placeholder: t('adminCreate.ownerNamePlaceholder'),
      icon: User,
    },
    {
      name: 'email',
      label: t('adminCreate.emailAddress'),
      type: 'email',
      placeholder: t('adminCreate.emailPlaceholder'),
      icon: Mail,
    },
    {
      name: 'password',
      label: t('adminCreate.password'),
      type: 'password',
      placeholder: t('adminCreate.passwordPlaceholder'),
      icon: Lock,
    },
  ]

  const storeFields: FieldConfig[] = [
    {
      name: 'storeName',
      label: t('adminCreate.storeName'),
      type: 'text',
      placeholder: t('adminCreate.storeNamePlaceholder'),
      icon: Building2,
    },
    {
      name: 'phone',
      label: t('adminCreate.phone'),
      type: 'text',
      placeholder: t('adminCreate.phonePlaceholder'),
      icon: Phone,
    },
    {
      name: 'address',
      label: t('adminCreate.storeAddress'),
      type: 'text',
      placeholder: t('adminCreate.addressPlaceholder'),
      icon: MapPin,
    },
  ]

  const locationFields: FieldConfig[] = [
    { name: 'city', label: t('adminCreate.city'), type: 'text', placeholder: t('adminCreate.cityPlaceholder'), icon: MapPin },
    { name: 'state', label: t('adminCreate.state'), type: 'text', placeholder: t('adminCreate.statePlaceholder'), icon: MapPin },
    {
      name: 'country',
      label: t('adminCreate.country'),
      type: 'text',
      placeholder: t('adminCreate.countryPlaceholder'),
      icon: MapPin,
      defaultValue: t('adminCreate.india'),
    },
  ]

  const extraFields: FieldConfig[] = [
    {
      name: 'workingHours',
      label: t('adminCreate.workingHours'),
      type: 'text',
      placeholder: t('adminCreate.workingHoursPlaceholder'),
      icon: Clock,
      defaultValue: '8:00 AM - 10:00 PM',
    },
  ]

  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    ;[...ownerFields, ...storeFields, ...locationFields, ...extraFields].forEach((f) => {
      defaults[f.name] = f.defaultValue ?? ''
    })
    return defaults
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // ── Validation ─────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.ownerName?.trim()) {
      newErrors.ownerName = t('adminCreate.validation.ownerNameRequired')
    }
    if (!formData.email?.trim()) {
      newErrors.email = t('adminCreate.validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('adminCreate.validation.emailInvalid')
    }
    if (!formData.password) {
      newErrors.password = t('adminCreate.validation.passwordRequired')
    } else if (formData.password.length < 6) {
      newErrors.password = t('adminCreate.validation.passwordMinLength')
    }
    if (!formData.storeName?.trim()) {
      newErrors.storeName = t('adminCreate.validation.storeNameRequired')
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = t('adminCreate.validation.phoneRequired')
    }
    if (!formData.address?.trim()) {
      newErrors.address = t('adminCreate.validation.addressRequired')
    }
    if (!formData.city?.trim()) {
      newErrors.city = t('adminCreate.validation.cityRequired')
    }
    if (!formData.state?.trim()) {
      newErrors.state = t('adminCreate.validation.stateRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: formData.ownerName,
          email: formData.email,
          password: formData.password,
          storeName: formData.storeName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country || t('adminCreate.india'),
          workingHours: formData.workingHours || '8:00 AM - 10:00 PM',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || t('adminCreate.toast.failed'))
      }

      toast.success(t('adminCreate.toast.success'), {
        description: t('adminCreate.toast.successDesc', { name: formData.storeName }),
      })

      // Refresh admin stores list
      try {
        const listRes = await fetch('/api/admin/stores')
        if (listRes.ok) {
          const listData = await listRes.json()
          setAdminStores(listData.stores ?? listData ?? [])
        }
      } catch {
        // Non-critical, navigate anyway
      }

      navigate('admin-panel')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('adminCreate.toast.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-3 px-4 pt-4 pb-2"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('admin-panel')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t('adminCreate.title')}</h1>
          <p className="text-xs text-muted-foreground">
            {t('adminCreate.subtitle')}
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
        {/* Owner Information */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('adminCreate.ownerInfo')} icon={User} />
          <Card className="border-neutral-100 shadow-none">
            <CardContent className="p-4 space-y-3">
              {ownerFields.map((field) => (
                <FormField
                  key={field.name}
                  config={field}
                  value={formData[field.name]}
                  error={errors[field.name]}
                  onChange={handleChange}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Store Information */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('adminCreate.storeInfo')} icon={Building2} />
          <Card className="border-neutral-100 shadow-none">
            <CardContent className="p-4 space-y-3">
              {storeFields.map((field) => (
                <FormField
                  key={field.name}
                  config={field}
                  value={formData[field.name]}
                  error={errors[field.name]}
                  onChange={handleChange}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Location */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('adminCreate.location')} icon={MapPin} />
          <Card className="border-neutral-100 shadow-none">
            <CardContent className="p-4">
              <div className="space-y-3">
                {locationFields.map((field) => (
                  <FormField
                    key={field.name}
                    config={field}
                    value={formData[field.name]}
                    error={errors[field.name]}
                    onChange={handleChange}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Details */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('adminCreate.additional')} icon={Clock} />
          <Card className="border-neutral-100 shadow-none">
            <CardContent className="p-4 space-y-3">
              {extraFields.map((field) => (
                <FormField
                  key={field.name}
                  config={field}
                  value={formData[field.name]}
                  error={errors[field.name]}
                  onChange={handleChange}
                />
              ))}
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
                {t('adminCreate.creating')}
              </>
            ) : (
              <>
                <Building2 className="size-4" />
                {t('adminCreate.createBtn')}
              </>
            )}
          </Button>
        </motion.div>
      </motion.form>
    </div>
  )
}