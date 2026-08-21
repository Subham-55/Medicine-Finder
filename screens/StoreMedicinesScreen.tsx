'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  IndianRupee,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useAppStore, type StoreMedicine } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// ── Animation helpers ──────────────────────────────────────────────────
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

// ── Category helpers ───────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'all', tkey: 'storeMed.all', label: 'All' },
  { value: 'general', tkey: 'category.general', label: 'General' },
  { value: 'antibiotics', tkey: 'category.antibiotics', label: 'Antibiotics' },
  { value: 'pain_relief', tkey: 'category.painRelief', label: 'Pain Relief' },
  { value: 'vitamins', tkey: 'category.vitamins', label: 'Vitamins' },
  { value: 'chronic', tkey: 'category.chronic', label: 'Chronic' },
  { value: 'respiratory', tkey: 'category.respiratory', label: 'Respiratory' },
  { value: 'skin', tkey: 'category.skin', label: 'Skin' },
  { value: 'digestive', tkey: 'category.digestive', label: 'Digestive' },
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

const categoryKeyMap: Record<string, string> = {
  general: 'category.general',
  antibiotics: 'category.antibiotics',
  pain_relief: 'category.painRelief',
  vitamins: 'category.vitamins',
  chronic: 'category.chronic',
  respiratory: 'category.respiratory',
  skin: 'category.skin',
  digestive: 'category.digestive',
}

// ── Skeleton card ──────────────────────────────────────────────────────
function MedicineCardSkeleton() {
  return (
    <Card className="border-neutral-100 py-0 shadow-none">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Component ──────────────────────────────────────────────────────────
export default function StoreMedicinesScreen() {
  const {
    user,
    storeMedicines,
    setStoreMedicines,
    navigate,
    goBack,
  } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<StoreMedicine | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch medicines
  const fetchMedicines = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (activeCategory !== 'all') params.set('category', activeCategory)
      const res = await fetch(`/api/store/medicines?${params.toString()}`, {
        headers: { 'X-User-Id': user.id },
      })
      if (res.ok) {
        const data = await res.json()
        setStoreMedicines(Array.isArray(data) ? data : data.medicines || [])
      }
    } catch {
      toast.error(t('storeMed.loadError'))
    } finally {
      setLoading(false)
    }
  }, [user?.id, searchQuery, activeCategory, setStoreMedicines])

  useEffect(() => {
    fetchMedicines()
  }, [fetchMedicines])

  // Delete medicine
  const handleDelete = async () => {
    if (!deleteTarget || !user?.id) return
    setDeleting(true)
    try {
      const res = await fetch('/api/store/medicines', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
        body: JSON.stringify({ medicineId: deleteTarget.id, userId: user.id }),
      })
      if (res.ok) {
        toast.success(t('storeMed.deleteSuccess', { name: deleteTarget.name }))
        setStoreMedicines(storeMedicines.filter((m) => m.id !== deleteTarget.id))
        setDeleteTarget(null)
      } else {
        toast.error(t('storeMed.deleteError'))
      }
    } catch {
      toast.error(t('storeMed.deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  // Edit: store selected medicine ID in sessionStorage and navigate
  const handleEdit = (med: StoreMedicine) => {
    sessionStorage.setItem('editingMedicineId', med.id)
    navigate('store-medicine-add')
  }

  // Filtered list (client-side in addition to API filter for instant response)
  const filteredMedicines = useMemo(() => {
    let list = storeMedicines
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
  }, [storeMedicines, searchQuery, activeCategory])

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
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
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{t('storeMed.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredMedicines.length} {t('storeMed.count')}
            </p>
          </div>
          <Button
            onClick={() => {
              sessionStorage.removeItem('editingMedicineId')
              navigate('store-medicine-add')
            }}
            className="gap-1.5"
            size="sm"
          >
            <Plus className="size-4" />
            {t('storeMed.addMedicine')}
          </Button>
        </motion.div>

        {/* ─── 2. Search Bar ──────────────────────────────────────────── */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('storeMed.searchPlaceholder')}
              className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm shadow-none transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
            />
          </div>
        </motion.div>

        {/* ─── 3. Category Filter Tabs ────────────────────────────────── */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                    activeCategory === cat.value
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {t(cat.tkey)}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-0" />
          </ScrollArea>
        </motion.div>

        {/* ─── 4. Medicine List ───────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <MedicineCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMedicines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-dashed border-neutral-200 py-12 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
                  <Package className="size-7 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{t('storeMed.noMedicines')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery || activeCategory !== 'all'
                      ? t('storeMed.noMedicinesDesc')
                      : t('storeMed.noMedicinesEmpty')}
                  </p>
                </div>
                {!searchQuery && activeCategory === 'all' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      sessionStorage.removeItem('editingMedicineId')
                      navigate('store-medicine-add')
                    }}
                    className="mt-1 gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    {t('storeMed.addFirst')}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
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
                    <CardContent className="p-4">
                      {/* Top row: name + category badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="truncate text-sm font-semibold text-neutral-900">{med.name}</p>
                          {med.genericName && (
                            <p className="truncate text-xs text-muted-foreground">{med.genericName}</p>
                          )}
                          {med.manufacturer && (
                            <p className="truncate text-xs text-muted-foreground">{med.manufacturer}</p>
                          )}
                        </div>
                        <Badge
                          className={`shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold ${categoryColors[med.category] || 'bg-neutral-100 text-neutral-700'}`}
                        >
                          {t(categoryKeyMap[med.category] || med.category)}
                        </Badge>
                      </div>

                      {/* Bottom row: price + stock + actions */}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Price */}
                          <div className="flex items-center gap-1">
                            <IndianRupee className="size-3 text-muted-foreground" />
                            <span className="text-sm font-bold tabular-nums">{med.price}</span>
                            {med.originalPrice > med.price && (
                              <>
                                <span className="text-xs text-muted-foreground line-through tabular-nums">
                                  {med.originalPrice}
                                </span>
                                <Badge className="rounded-md bg-emerald-100 px-1.5 py-0 text-[10px] font-semibold text-emerald-700">
                                  {med.discount}{t('common.percentOff')}
                                </Badge>
                              </>
                            )}
                          </div>

                          {/* Stock */}
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
                            onClick={() => handleEdit(med)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(med)}
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
      </div>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              {t('storeMed.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('storeMed.deleteDialog.description')} <strong>"{deleteTarget?.name}"</strong>? {t('storeMed.deleteDialog.warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('storeMed.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? t('storeMed.deleteDialog.deleting') : t('storeMed.deleteDialog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}