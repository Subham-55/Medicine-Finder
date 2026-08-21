'use client'

import { useState, useEffect, useMemo, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  IndianRupee,
  Percent,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAppStore, type StoreMedicine } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// ── Animation helpers ──────────────────────────────────────────────────
const sectionFade = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const CATEGORIES = [
  { value: 'general', tkey: 'category.general', label: 'General' },
  { value: 'antibiotics', tkey: 'category.antibiotics', label: 'Antibiotics' },
  { value: 'pain_relief', tkey: 'category.painRelief', label: 'Pain Relief' },
  { value: 'vitamins', tkey: 'category.vitamins', label: 'Vitamins' },
  { value: 'chronic', tkey: 'category.chronic', label: 'Chronic' },
  { value: 'respiratory', tkey: 'category.respiratory', label: 'Respiratory' },
  { value: 'skin', tkey: 'category.skin', label: 'Skin' },
  { value: 'digestive', tkey: 'category.digestive', label: 'Digestive' },
] as const

// ── Component ──────────────────────────────────────────────────────────
export default function StoreMedicineAddScreen() {
  const {
    user,
    storeMedicines,
    setStoreMedicines,
    navigate,
    goBack,
  } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Editing state
  const [editingMedicine, setEditingMedicine] = useState<StoreMedicine | null>(null)
  const isEditing = !!editingMedicine

  // Form state
  const [name, setName] = useState('')
  const [genericName, setGenericName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [category, setCategory] = useState('general')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('')
  const [description, setDescription] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-calculated discount
  const discount = useMemo(() => {
    const p = parseFloat(price)
    const o = parseFloat(originalPrice)
    if (!p || !o || o <= 0 || p > o) return 0
    return Math.round((1 - p / o) * 100)
  }, [price, originalPrice])

  // Auto-calculated inStock
  const inStock = useMemo(() => {
    return parseInt(stockQuantity) > 0
  }, [stockQuantity])

  // Load medicine data if editing
  useEffect(() => {
    setMounted(true)
    const editId = sessionStorage.getItem('editingMedicineId')
    if (editId && storeMedicines.length > 0) {
      const found = storeMedicines.find((m) => m.id === editId)
      if (found) {
        setEditingMedicine(found)
        setName(found.name)
        setGenericName(found.genericName)
        setManufacturer(found.manufacturer)
        setCategory(found.category)
        setPrice(String(found.price))
        setOriginalPrice(String(found.originalPrice))
        setStockQuantity(String(found.stockQuantity))
        setDescription(found.description || '')
      }
    }
  }, [storeMedicines])

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = t('storeMedForm.validation.nameRequired')
    if (!price || parseFloat(price) <= 0) newErrors.price = t('storeMedForm.validation.priceRequired')
    if (!originalPrice || parseFloat(originalPrice) <= 0) newErrors.originalPrice = t('storeMedForm.validation.mrpRequired')

    const p = parseFloat(price)
    const o = parseFloat(originalPrice)
    if (p > 0 && o > 0 && p > o) {
      newErrors.price = t('storeMedForm.validation.priceExceedsMRP')
    }

    if (!stockQuantity || parseInt(stockQuantity) < 0) {
      newErrors.stockQuantity = t('storeMedForm.validation.stockRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate() || !user?.id) return

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        genericName: genericName.trim(),
        manufacturer: manufacturer.trim(),
        category,
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice),
        stockQuantity: parseInt(stockQuantity),
        inStock,
        discount,
        description: description.trim() || undefined,
      }

      if (isEditing && editingMedicine) {
        body.medicineId = editingMedicine.id
      }

      const res = await fetch('/api/store/medicines', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        if (isEditing) {
          // Update locally
          setStoreMedicines(
            storeMedicines.map((m) => (m.id === editingMedicine.id ? { ...m, ...data } : m))
          )
          toast.success(t('storeMedForm.toast.updateSuccess', { name }))
        } else {
          setStoreMedicines([data, ...storeMedicines])
          toast.success(t('storeMedForm.toast.addSuccess', { name }))
        }
        sessionStorage.removeItem('editingMedicineId')
        navigate('store-medicines')
      } else {
        const errData = await res.json().catch(() => null)
        toast.error(errData?.error || t(isEditing ? 'storeMedForm.toast.updateError' : 'storeMedForm.toast.addError'))
      }
    } catch {
      toast.error(t(isEditing ? 'storeMedForm.toast.updateError' : 'storeMedForm.toast.addError'))
    } finally {
      setSubmitting(false)
    }
  }

  // Don't render until mounted (to avoid hydration mismatch)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-7 w-48" />
          </div>
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* ─── 1. Header ──────────────────────────────────────────────── */}
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
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              {isEditing ? t('storeMedForm.editTitle') : t('storeMedForm.addTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? t('storeMedForm.editDesc') : t('storeMedForm.addDesc')}
            </p>
          </div>
        </motion.div>

        {/* ─── 2. Form ────────────────────────────────────────────────── */}
        <motion.form
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Basic Info Card */}
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{t('storeMedForm.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Medicine Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  {t('storeMedForm.name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  placeholder={t('storeMedForm.namePlaceholder')}
                  className="h-10 rounded-lg border-neutral-200 bg-neutral-50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Generic Name */}
              <div className="space-y-1.5">
                <Label htmlFor="genericName" className="text-sm font-medium">
                  {t('storeMedForm.genericName')}
                </Label>
                <Input
                  id="genericName"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder={t('storeMedForm.genericNamePlaceholder')}
                  className="h-10 rounded-lg border-neutral-200 bg-neutral-50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                />
              </div>

              {/* Manufacturer */}
              <div className="space-y-1.5">
                <Label htmlFor="manufacturer" className="text-sm font-medium">
                  {t('storeMedForm.manufacturer')}
                </Label>
                <Input
                  id="manufacturer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder={t('storeMedForm.manufacturerPlaceholder')}
                  className="h-10 rounded-lg border-neutral-200 bg-neutral-50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('storeMedForm.category')}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 rounded-lg border-neutral-200 bg-neutral-50 text-sm shadow-none focus:ring-1 focus:ring-neutral-300">
                    <SelectValue placeholder={t('storeMedForm.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {t(cat.tkey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Card */}
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{t('storeMedForm.pricing')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-medium">
                  {t('storeMedForm.sellingPrice')} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value)
                      if (errors.price) setErrors((prev) => ({ ...prev, price: '' }))
                    }}
                    placeholder="0.00"
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-9 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                  />
                </div>
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
              </div>

              {/* Original Price / MRP */}
              <div className="space-y-1.5">
                <Label htmlFor="originalPrice" className="text-sm font-medium">
                  {t('storeMedForm.originalPrice')} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => {
                      setOriginalPrice(e.target.value)
                      if (errors.originalPrice)
                        setErrors((prev) => ({ ...prev, originalPrice: '' }))
                    }}
                    placeholder="0.00"
                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-9 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                  />
                </div>
                {errors.originalPrice && (
                  <p className="text-xs text-destructive">{errors.originalPrice}</p>
                )}
              </div>

              {/* Discount & Stock status preview */}
              {(parseFloat(price) > 0 && parseFloat(originalPrice) > 0) && (
                <div className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50/50 p-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
                    <Percent className="size-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('storeMedForm.autoDiscount')}</p>
                    <p className="text-sm font-semibold">
                      {discount > 0 ? (
                        <>
                          <span className="text-emerald-700">{discount}{t('common.percentOff')}</span>
                          <span className="ml-2 text-muted-foreground font-normal">
                            {t('storeMedForm.saveAmount', { amount: (parseFloat(originalPrice) - parseFloat(price)).toFixed(2) })}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{t('storeMedForm.noDiscount')}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Card */}
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{t('storeMedForm.stock')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stock Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="stockQuantity" className="text-sm font-medium">
                  {t('storeMedForm.stockQuantity')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => {
                    setStockQuantity(e.target.value)
                    if (errors.stockQuantity) setErrors((prev) => ({ ...prev, stockQuantity: '' }))
                  }}
                  placeholder="0"
                  className="h-10 rounded-lg border-neutral-200 bg-neutral-50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
                />
                {errors.stockQuantity && (
                  <p className="text-xs text-destructive">{errors.stockQuantity}</p>
                )}
              </div>

              {/* Stock status preview */}
              {stockQuantity && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t('storeMedForm.statusLabel')}</span>
                  <Badge
                    variant={inStock ? 'default' : 'destructive'}
                    className="rounded-md px-1.5 py-0 text-[10px] font-semibold"
                  >
                    {inStock ? t('common.inStock') : t('common.outOfStock')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{t('storeMedForm.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('storeMedForm.descriptionPlaceholder')}
                rows={4}
                className="rounded-lg border-neutral-200 bg-neutral-50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300 resize-none"
              />
            </CardContent>
          </Card>

          <Separator />

          {/* ─── Submit Button ────────────────────────────────────────── */}
          <motion.div variants={sectionFade} initial="hidden" animate="visible" className="pb-6">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2"
              size="lg"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {submitting
                ? isEditing
                  ? t('storeMedForm.updating')
                  : t('storeMedForm.adding')
                : isEditing
                  ? t('storeMedForm.updateBtn')
                  : t('storeMedForm.addBtn')}
            </Button>
          </motion.div>
        </motion.form>
      </div>
    </div>
  )
}