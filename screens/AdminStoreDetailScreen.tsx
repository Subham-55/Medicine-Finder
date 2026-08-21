'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  Building2,
  BadgeCheck,
  BadgeX,
  Calendar,
  IndianRupee,
  Search,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Tag,
  Factory,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, type StoreMedicine } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────
interface StoreDetail {
  id: string
  name: string
  address: string
  city: string
  state: string
  country: string
  phone: string
  lat: number | null
  lng: number | null
  licenseNumber: string | null
  isOpen: boolean
  isActive: boolean
  workingHours: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string
    email: string
    mobile: string | null
    avatar: string | null
    isActive: boolean
    createdAt: string
  }
  medicines: StoreMedicine[]
  medicineCount: number
}

interface StoreStats {
  totalMedicines: number
  inStock: number
  outOfStock: number
  avgPrice: number
  categories: string[]
}

// ── Animation helpers ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const sectionFade = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ── Category helpers ─────────────────────────────────────────────────────
const CATEGORIES_VALUES = [
  'all',
  'general',
  'antibiotics',
  'pain_relief',
  'vitamins',
  'chronic',
  'respiratory',
  'skin',
  'digestive',
] as const

const categoryColors: Record<string, string> = {
  general: 'bg-neutral-100 text-neutral-700',
  antibiotics: 'bg-emerald-100 text-emerald-700',
  pain_relief: 'bg-amber-100 text-amber-700',
  vitamins: 'bg-orange-100 text-orange-700',
  chronic: 'bg-rose-100 text-rose-700',
  respiratory: 'bg-sky-100 text-sky-700',
  skin: 'bg-pink-100 text-pink-700',
  digestive: 'bg-lime-100 text-lime-700',
}

// Category labels are now provided via i18n (t function)

// ── Skeleton ─────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Format date helper ───────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Component ────────────────────────────────────────────────────────────
export default function AdminStoreDetailScreen() {
  const { adminSelectedStoreId, navigate, goBack } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const getCategoryLabel = (key: string) => t(`category.${key}`)

  const CATEGORIES = [
    { value: 'all', label: t('category.all') },
    { value: 'general', label: t('category.general') },
    { value: 'antibiotics', label: t('category.antibiotics') },
    { value: 'pain_relief', label: t('category.pain_relief') },
    { value: 'vitamins', label: t('category.vitamins') },
    { value: 'chronic', label: t('category.chronic') },
    { value: 'respiratory', label: t('category.respiratory') },
    { value: 'skin', label: t('category.skin') },
    { value: 'digestive', label: t('category.digestive') },
  ] as const

  const [store, setStore] = useState<StoreDetail | null>(null)
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  // Medicine management
  const [editMedicine, setEditMedicine] = useState<StoreMedicine | null>(null)
  const [deleteMedicine, setDeleteMedicine] = useState<StoreMedicine | null>(null)
  const [savingMedicine, setSavingMedicine] = useState(false)
  const [deletingMedicine, setDeletingMedicine] = useState(false)

  // Edit medicine form state
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  // ── Fetch store details ────────────────────────────────────────────────
  const fetchStore = useCallback(async () => {
    if (!adminSelectedStoreId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/stores/${adminSelectedStoreId}`)
      if (res.ok) {
        const data = await res.json()
        setStore(data.store)
        setStats(data.stats)
      } else {
        toast.error(t('adminDetail.failed.loadStore'))
        goBack()
      }
    } catch {
      toast.error(t('adminDetail.failed.loadStore'))
      goBack()
    } finally {
      setLoading(false)
    }
  }, [adminSelectedStoreId, goBack])

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

  // ── Filtered medicines ─────────────────────────────────────────────────
  const filteredMedicines = useMemo(() => {
    if (!store) return []
    let list = store.medicines
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.manufacturer.toLowerCase().includes(q)
      )
    }
    if (activeCategory !== 'all') {
      list = list.filter((m) => m.category === activeCategory)
    }
    return list
  }, [store, searchQuery, activeCategory])

  // ── Open edit medicine dialog ──────────────────────────────────────────
  const handleOpenEdit = (med: StoreMedicine) => {
    setEditForm({
      name: med.name,
      genericName: med.genericName || '',
      manufacturer: med.manufacturer || '',
      category: med.category,
      price: String(med.price),
      originalPrice: String(med.originalPrice),
      discount: String(med.discount),
      stockQuantity: String(med.stockQuantity),
      inStock: String(med.inStock),
      description: med.description || '',
    })
    setEditMedicine(med)
  }

  // ── Save edited medicine ───────────────────────────────────────────────
  const handleSaveMedicine = async () => {
    if (!editMedicine) return
    setSavingMedicine(true)
    try {
      const res = await fetch(`/api/admin/medicines/${editMedicine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          genericName: editForm.genericName,
          manufacturer: editForm.manufacturer,
          category: editForm.category,
          price: Number(editForm.price),
          originalPrice: Number(editForm.originalPrice),
          discount: Number(editForm.discount),
          stockQuantity: Number(editForm.stockQuantity),
          inStock: editForm.inStock === 'true',
          description: editForm.description,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        // Update local state
        if (store) {
          setStore({
            ...store,
            medicines: store.medicines.map((m) =>
              m.id === editMedicine.id
                ? { ...m, ...data.medicine, price: Number(data.medicine.price), originalPrice: Number(data.medicine.originalPrice), discount: Number(data.medicine.discount), stockQuantity: Number(data.medicine.stockQuantity) }
                : m
            ),
          })
        }
        toast.success(t('adminDetail.editMedicine.success', { name: editForm.name }))
        setEditMedicine(null)
        // Re-fetch to get updated stats
        fetchStore()
      } else {
        toast.error(t('adminDetail.editMedicine.failed'))
      }
    } catch {
      toast.error(t('adminDetail.editMedicine.failed'))
    } finally {
      setSavingMedicine(false)
    }
  }

  // ── Delete medicine ────────────────────────────────────────────────────
  const handleDeleteMedicine = async () => {
    if (!deleteMedicine) return
    setDeletingMedicine(true)
    try {
      const res = await fetch(`/api/admin/medicines/${deleteMedicine.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success(t('adminDetail.deleteMedicine.success', { name: deleteMedicine.name }))
        if (store) {
          setStore({
            ...store,
            medicines: store.medicines.filter((m) => m.id !== deleteMedicine.id),
            medicineCount: store.medicineCount - 1,
          })
        }
        setDeleteMedicine(null)
        // Re-fetch to get updated stats
        fetchStore()
      } else {
        toast.error(t('adminDetail.deleteMedicine.failed'))
      }
    } catch {
      toast.error(t('adminDetail.deleteMedicine.failed'))
    } finally {
      setDeletingMedicine(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading || !store) return <DetailSkeleton />

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ─── 1. Header ──────────────────────────────────────────────── */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          className="flex items-start justify-between"
        >
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={goBack} className="mt-0.5 shrink-0">
              <ArrowLeft className="size-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                  {store.name}
                </h1>
                <Badge
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                    store.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {store.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
                <Badge
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                    store.isOpen
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {store.isOpen ? t('common.open') : t('common.closed')}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t('adminDetail.management')} &bull; {store.city}, {store.state}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('admin-store-edit')}
            className="shrink-0 gap-1.5"
          >
            <Pencil className="size-3.5" />
            <span className="hidden sm:inline">{t('adminDetail.editStore')}</span>
          </Button>
        </motion.div>

        {/* ─── 2. Stats Cards ─────────────────────────────────────────── */}
        {stats && (
          <motion.div
            variants={sectionFade}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              {
                label: t('adminDetail.totalMedicines'),
                value: stats.totalMedicines,
                icon: Package,
                color: 'text-neutral-700',
                bg: 'bg-neutral-100',
              },
              {
                label: t('adminDetail.inStock'),
                value: stats.inStock,
                icon: CheckCircle,
                color: 'text-emerald-700',
                bg: 'bg-emerald-100',
              },
              {
                label: t('adminDetail.outOfStock'),
                value: stats.outOfStock,
                icon: XCircle,
                color: 'text-rose-700',
                bg: 'bg-rose-100',
              },
              {
                label: t('adminDetail.avgPrice'),
                value: `\u20B9${stats.avgPrice}`,
                icon: IndianRupee,
                color: 'text-amber-700',
                bg: 'bg-amber-100',
              },
            ].map((stat, i) => (
              <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="border-neutral-100 py-0 shadow-none">
                  <CardContent className="p-4">
                    <div className={`mb-2 flex size-8 items-center justify-center rounded-lg ${stat.bg}`}>
                      <stat.icon className={`size-4 ${stat.color}`} />
                    </div>
                    <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ─── 3. Store & Owner Info ──────────────────────────────────── */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="size-4 text-muted-foreground" />
                {t('adminDetail.storeOwnerInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Owner info */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-lg bg-neutral-50 p-3">
                  <div className="flex items-center gap-2">
                    <User className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('adminDetail.owner')}</span>
                  </div>
                  <p className="text-sm font-medium">{store.owner.name}</p>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Mail className="size-3 shrink-0" />
                      <span className="truncate">{store.owner.email}</span>
                    </div>
                    {store.owner.mobile && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3 shrink-0" />
                        <span>{store.owner.mobile}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {store.owner.isActive ? (
                      <BadgeCheck className="size-3.5 text-emerald-600" />
                    ) : (
                      <BadgeX className="size-3.5 text-rose-500" />
                    )}
                    <span className={store.owner.isActive ? 'text-emerald-600' : 'text-rose-500'}>
                      {store.owner.isActive ? t('adminDetail.accountActive') : t('adminDetail.accountInactive')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg bg-neutral-50 p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('adminDetail.storeDetails')}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 size-3 shrink-0" />
                      <span>{store.address}, {store.city}, {store.state}, {store.country}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3 shrink-0" />
                      <span>{store.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 shrink-0" />
                      <span>{store.workingHours}</span>
                    </div>
                    {store.licenseNumber && (
                      <div className="flex items-center gap-1.5">
                        <BadgeCheck className="size-3 shrink-0" />
                        <span>{t('adminDetail.license')}: {store.licenseNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Timeline */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  <span>{t('adminDetail.created')}: {formatDate(store.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  <span>{t('adminDetail.updated')}: {formatDate(store.updatedAt)}</span>
                </div>
                {stats && stats.categories.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="size-3" />
                    <span>{t('adminDetail.categories')}: {stats.categories.map(c => getCategoryLabel(c)).join(', ')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 4. Medicine Inventory ──────────────────────────────────── */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              {t('adminDetail.medicineInventory')} ({filteredMedicines.length})
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('adminDetail.searchPlaceholder')}
              className="h-10 rounded-xl border-neutral-200 bg-neutral-50 pl-10 pr-10 text-sm shadow-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
                onClick={() => setSearchQuery('')}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>

          {/* Category filter */}
          <ScrollArea className="mb-4 w-full">
            <div className="flex gap-2 pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-[0.97] ${
                    activeCategory === cat.value
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-0" />
          </ScrollArea>

          {/* Medicine list */}
          {filteredMedicines.length === 0 ? (
            <Card className="border-dashed border-neutral-200 py-12 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
                  <Package className="size-7 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{t('adminDetail.noMedicines')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery || activeCategory !== 'all'
                      ? t('adminDetail.noMedicinesDesc')
                      : t('adminDetail.noMedicinesEmpty')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div className="space-y-2">
                {filteredMedicines.map((med, i) => (
                  <motion.div
                    key={med.id}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -20 }}
                    layout
                  >
                    <Card className="border-neutral-100 py-0 shadow-none transition-colors hover:bg-neutral-50/60">
                      <CardContent className="p-3 sm:p-4">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                                <Package className="size-4 text-neutral-600" />
                              </div>
                              <p className="truncate text-sm font-semibold text-neutral-900">{med.name}</p>
                            </div>
                            <div className="ml-10 space-y-0.5">
                              {med.genericName && (
                                <p className="truncate text-xs text-muted-foreground">{med.genericName}</p>
                              )}
                              {med.manufacturer && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Factory className="size-3 shrink-0" />
                                  <span className="truncate">{med.manufacturer}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge
                            className={`shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold ${categoryColors[med.category] || 'bg-neutral-100 text-neutral-700'}`}
                          >
                            {getCategoryLabel(med.category)}
                          </Badge>
                        </div>

                        {/* Bottom row */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <IndianRupee className="size-3 text-muted-foreground" />
                              <span className="text-sm font-bold tabular-nums">{med.price}</span>
                              {med.originalPrice > med.price && (
                                <>
                                  <span className="text-xs text-muted-foreground line-through tabular-nums">
                                    {med.originalPrice}
                                  </span>
                                  <Badge className="rounded-md bg-emerald-100 px-1.5 py-0 text-[10px] font-semibold text-emerald-700">
                                    {med.discount}% off
                                  </Badge>
                                </>
                              )}
                            </div>
                            <Badge
                              variant={med.inStock ? 'default' : 'destructive'}
                              className="rounded-md px-1.5 py-0 text-[10px] font-semibold"
                            >
                              {med.inStock ? t('common.inStock') : t('common.outOfStock')}
                              {med.inStock && med.stockQuantity > 0 && (
                                <span className="ml-1 opacity-70">({med.stockQuantity})</span>
                              )}
                            </Badge>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(med)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteMedicine(med)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="border-t border-neutral-100 py-6"
      >
        <p className="text-center text-xs text-muted-foreground">
          {t('adminDetail.footer')}
        </p>
      </motion.div>

      {/* ─── Edit Medicine Dialog ────────────────────────────────────── */}
      <Dialog open={!!editMedicine} onOpenChange={(open) => !open && setEditMedicine(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4" />
              {t('adminDetail.editMedicine.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('adminDetail.editMedicine.name')} *</Label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('adminDetail.editMedicine.genericName')}</Label>
              <Input
                value={editForm.genericName || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, genericName: e.target.value }))}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('adminDetail.editMedicine.manufacturer')}</Label>
              <Input
                value={editForm.manufacturer || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, manufacturer: e.target.value }))}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('adminDetail.editMedicine.category')}</Label>
              <Select
                value={editForm.category || 'general'}
                onValueChange={(v) => setEditForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('adminDetail.editMedicine.price')} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.price || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('adminDetail.editMedicine.originalPrice')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.originalPrice || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, originalPrice: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('adminDetail.editMedicine.discount')}</Label>
                <Input
                  type="number"
                  value={editForm.discount || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, discount: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('adminDetail.editMedicine.stockQty')}</Label>
                <Input
                  type="number"
                  value={editForm.stockQuantity || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, stockQuantity: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('adminDetail.editMedicine.inStock')}</Label>
                <Select
                  value={editForm.inStock || 'true'}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, inStock: v }))}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('adminDetail.editMedicine.description')}</Label>
              <Input
                value={editForm.description || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                className="h-10 text-sm"
                placeholder={t('adminDetail.editMedicine.descriptionPlaceholder')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditMedicine(null)} size="sm">
              {t('adminDetail.editMedicine.cancel')}
            </Button>
            <Button
              onClick={handleSaveMedicine}
              disabled={savingMedicine || !editForm.name?.trim()}
              size="sm"
              className="gap-1.5"
            >
              {savingMedicine ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Pencil className="size-3.5" />
              )}
              {t('adminDetail.editMedicine.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Medicine Dialog ──────────────────────────────────── */}
      <AlertDialog
        open={!!deleteMedicine}
        onOpenChange={(open) => !open && setDeleteMedicine(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              {t('adminDetail.deleteMedicine.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminDetail.deleteMedicine.desc', { name: deleteMedicine?.name || '', store: store?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingMedicine}>{t('adminDetail.deleteMedicine.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMedicine}
              disabled={deletingMedicine}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingMedicine ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t('adminDetail.deleteMedicine.deleting')}
                </span>
              ) : (
                t('adminDetail.deleteMedicine.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}