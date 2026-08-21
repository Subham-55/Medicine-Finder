'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LogOut,
  Pencil,
  Package,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Store,
  IndianRupee,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type StoreMedicine } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// ── Animation helpers ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
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

// ── Category color map ─────────────────────────────────────────────────
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

// ── Component ──────────────────────────────────────────────────────────
export default function StoreDashboardScreen() {
  const {
    user,
    storeData,
    setStoreData,
    storeMedicines,
    setStoreMedicines,
    navigate,
    logout,
  } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const [loading, setLoading] = useState(true)
  const [medicinesLoading, setMedicinesLoading] = useState(true)

  // Fetch store profile on mount
  const fetchStoreProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch('/api/store/profile', {
        headers: { 'X-User-Id': user.id },
      })
      if (res.ok) {
        const data = await res.json()
        setStoreData(data.store)
      } else {
        toast.error(t('storeDash.loadProfileError'))
      }
    } catch {
      toast.error(t('storeDash.loadProfileError'))
    } finally {
      setLoading(false)
    }
  }, [user?.id, setStoreData])

  // Fetch recent medicines on mount
  const fetchMedicines = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch('/api/store/medicines?_limit=10', {
        headers: { 'X-User-Id': user.id },
      })
      if (res.ok) {
        const data = await res.json()
        setStoreMedicines(Array.isArray(data) ? data : data.medicines || [])
      }
    } catch {
      // silent
    } finally {
      setMedicinesLoading(false)
    }
  }, [user?.id, setStoreMedicines])

  useEffect(() => {
    fetchStoreProfile()
    fetchMedicines()
  }, [fetchStoreProfile, fetchMedicines])

  // Computed stats
  const totalMedicines = storeMedicines.length
  const inStockCount = storeMedicines.filter((m) => m.inStock).length
  const outOfStockCount = totalMedicines - inStockCount

  const handleLogout = () => {
    logout()
    toast.success(t('storeDash.logoutSuccess'))
  }

  // ── Loading skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

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
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {storeData?.name || t('storeDash.myStore')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('storeDash.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('store-profile-edit')}
              className="gap-1.5"
            >
              <Pencil className="size-3.5" />
              {t('storeDash.editProfile')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-3.5" />
              {t('common.logout')}
            </Button>
          </div>
        </motion.div>

        {/* ─── 2. Stats Cards ─────────────────────────────────────────── */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-3"
        >
          {[
            {
              label: t('storeDash.totalMedicines'),
              value: totalMedicines,
              icon: Package,
              color: 'text-neutral-700',
              bg: 'bg-neutral-100',
            },
            {
              label: t('storeDash.inStock'),
              value: inStockCount,
              icon: CheckCircle,
              color: 'text-emerald-700',
              bg: 'bg-emerald-100',
            },
            {
              label: t('storeDash.outOfStock'),
              value: outOfStockCount,
              icon: XCircle,
              color: 'text-rose-700',
              bg: 'bg-rose-100',
            },
          ].map((stat, i) => (
            <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="border-neutral-100 py-0 shadow-none">
                <CardContent className="p-4">
                  <div className={`mb-2 flex size-8 items-center justify-center rounded-lg ${stat.bg}`}>
                    <stat.icon className={`size-4 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── 3. Store Info Card ─────────────────────────────────────── */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Store className="size-4 text-muted-foreground" />
                {t('storeDash.storeInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('storeDash.address')}</p>
                  <p className="text-sm font-medium">
                    {storeData?.address || 'N/A'}
                    {storeData?.city && `, ${storeData.city}`}
                    {storeData?.state && `, ${storeData.state}`}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('storeDash.phone')}</p>
                  <p className="text-sm font-medium">{storeData?.phone || 'N/A'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('storeDash.workingHours')}</p>
                  <p className="text-sm font-medium">{storeData?.workingHours || 'N/A'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t('storeDash.status')}</p>
                <Badge
                  variant={storeData?.isOpen ? 'default' : 'destructive'}
                  className="rounded-md px-2 py-0.5 text-xs font-semibold"
                >
                  {storeData?.isOpen ? t('common.open') : t('common.closed')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 4. Recent Medicines ────────────────────────────────────── */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">{t('storeDash.recentMedicines')}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('store-medicines')}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            >
              {t('storeDash.viewAll')}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

          {medicinesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : storeMedicines.length === 0 ? (
            <Card className="border-dashed border-neutral-200 py-8 shadow-none">
              <CardContent className="flex flex-col items-center gap-2 text-center">
                <Package className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{t('storeDash.noMedicines')}</p>
                <Button
                  size="sm"
                  onClick={() => navigate('store-medicine-add')}
                  className="mt-1"
                >
                  {t('storeDash.addMedicine')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {storeMedicines.slice(0, 10).map((med: StoreMedicine, i: number) => (
                <motion.div
                  key={med.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="border-neutral-100 py-0 shadow-none transition-colors hover:bg-neutral-50/60">
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <Package className="size-4 text-neutral-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{med.name}</p>
                          <Badge
                            className={`shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold ${categoryColors[med.category] || 'bg-neutral-100 text-neutral-700'}`}
                          >
                            {t(categoryKeyMap[med.category] || med.category)}
                          </Badge>
                        </div>
                        {med.genericName && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {med.genericName}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee className="size-3 text-muted-foreground" />
                          <span className="text-sm font-semibold">{med.price}</span>
                          {med.originalPrice > med.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              {med.originalPrice}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={med.inStock ? 'default' : 'destructive'}
                          className="mt-1 rounded-md px-1.5 py-0 text-[10px] font-semibold"
                        >
                          {med.inStock ? t('common.inStock') : t('common.outOfStock')}
                          {med.inStock && med.stockQuantity > 0 && (
                            <span className="ml-1 opacity-70">({med.stockQuantity})</span>
                          )}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ─── 5. Manage Medicines Button ─────────────────────────────── */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible" className="pb-6">
          <Button
            onClick={() => navigate('store-medicines')}
            className="w-full gap-2"
            size="lg"
          >
            <Package className="size-4" />
            {t('storeDash.manageMedicines')}
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}