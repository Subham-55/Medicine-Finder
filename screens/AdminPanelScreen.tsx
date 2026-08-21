'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Search,
  Plus,
  Trash2,
  LogOut,
  Building2,
  Users,
  Package,
  MapPin,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  Store,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────
interface AdminStore {
  id: string
  name: string
  address: string
  city: string
  state: string
  country: string
  phone: string
  isOpen: boolean
  isActive: boolean
  workingHours: string
  licenseNumber: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string
    email: string
    avatar: string
    isActive: boolean
  }
  medicineCount: number
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

// ── Stats card skeleton ──────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card className="border-neutral-100 shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <Skeleton className="size-10 shrink-0 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-10" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Store card skeleton ──────────────────────────────────────────────────
function StoreCardSkeleton() {
  return (
    <Card className="border-neutral-100 py-0 shadow-none">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3.5 w-36" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Component ────────────────────────────────────────────────────────────
export default function AdminPanelScreen() {
  const { user, navigate, logout, setAdminSelectedStoreId } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const [stores, setStores] = useState<AdminStore[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AdminStore | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // ── Fetch stores ───────────────────────────────────────────────────────
  const fetchStores = useCallback(async (query = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      const res = await fetch(`/api/admin/stores${query ? `?${params.toString()}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        setStores(data.stores || [])
      } else {
        toast.error(t('admin.failed.loadStores'))
      }
    } catch {
      toast.error(t('admin.failed.loadStores'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  // ── Debounced search ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStores(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, fetchStores])

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = stores.length
    const active = stores.filter((s) => s.isActive).length
    const medicines = stores.reduce((sum, s) => sum + (s.medicineCount || 0), 0)
    return { total, active, medicines }
  }, [stores])

  // ── Toggle store status ────────────────────────────────────────────────
  const handleToggle = async (store: AdminStore, field: 'isActive' | 'isOpen') => {
    const newValue = !store[field]
    // Optimistic update
    setStores((prev) =>
      prev.map((s) => (s.id === store.id ? { ...s, [field]: newValue } : s))
    )
    setTogglingId(store.id)
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, [field]: newValue }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.store) {
          setStores((prev) =>
            prev.map((s) => (s.id === store.id ? { ...s, ...data.store } : s))
          )
        }
        if (field === 'isActive') {
          toast.success(newValue ? t('admin.toast.activated', { name: store.name }) : t('admin.toast.deactivated', { name: store.name }))
        } else {
          toast.success(newValue ? t('admin.toast.opened', { name: store.name }) : t('admin.toast.closed', { name: store.name }))
        }
      } else {
        // Revert on failure
        setStores((prev) =>
          prev.map((s) => (s.id === store.id ? { ...s, [field]: !newValue } : s))
        )
        toast.error(t('admin.failed.updateStatus'))
      }
    } catch {
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, [field]: !newValue } : s))
      )
      toast.error(t('admin.failed.updateStatus'))
    } finally {
      setTogglingId(null)
    }
  }

  // ── Delete store ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: deleteTarget.id }),
      })
      if (res.ok) {
        toast.success(t('admin.toast.deleted', { name: deleteTarget.name }))
        setStores((prev) => prev.filter((s) => s.id !== deleteTarget.id))
        setDeleteTarget(null)
      } else {
        toast.error(t('admin.failed.delete'))
      }
    } catch {
      toast.error(t('admin.failed.delete'))
    } finally {
      setDeleting(false)
    }
  }

  // ── View store details ─────────────────────────────────────────────────
  const handleViewStore = (store: AdminStore) => {
    setAdminSelectedStoreId(store.id)
    navigate('admin-store-detail')
  }

  // ── Handle logout ──────────────────────────────────────────────────────
  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          {/* ─── 1. Header ──────────────────────────────────────────────── */}
          <motion.div
            variants={sectionFade}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
                <Shield className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('admin.title')}</h1>
                <p className="text-sm text-muted-foreground">
                  {user?.name ? t('admin.welcome', { name: user.name }) : t('admin.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('admin-store-create')}
                className="gap-1.5"
                size="sm"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">{t('admin.createStore')}</span>
                <span className="sm:hidden">{t('common.create')}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{t('common.logout')}</span>
              </Button>
            </div>
          </motion.div>

          {/* ─── 2. Stats Row ──────────────────────────────────────────── */}
          {loading ? (
            <motion.div
              variants={sectionFade}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-3"
            >
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </motion.div>
          ) : (
            <motion.div
              variants={sectionFade}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-3"
            >
              {/* Total Stores */}
              <Card className="border-neutral-100 shadow-none">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                    <Building2 className="size-5 text-neutral-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t('admin.totalStores')}</p>
                    <p className="text-xl font-bold tabular-nums">{stats.total}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Active Stores */}
              <Card className="border-neutral-100 shadow-none">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <Users className="size-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t('admin.active')}</p>
                    <p className="text-xl font-bold tabular-nums text-emerald-700">{stats.active}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Medicines */}
              <Card className="border-neutral-100 shadow-none">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                    <Package className="size-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t('admin.medicineCount')}</p>
                    <p className="text-xl font-bold tabular-nums text-amber-700">{stats.medicines}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── 3. Search Bar ──────────────────────────────────────────── */}
          <motion.div variants={sectionFade} initial="hidden" animate="visible">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.searchPlaceholder')}
                className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-10 pr-10 text-sm shadow-none transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-300"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch('')}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </motion.div>

          {/* ─── 4. Results count ───────────────────────────────────────── */}
          {!loading && stores.length > 0 && (
            <motion.div
              variants={sectionFade}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-between"
            >
              <p className="text-sm text-muted-foreground">
                {t('admin.showing')} <span className="font-medium text-foreground">{stores.length}</span>{' '}
                {t('admin.stores')}
                {search && (
                  <>
                    {' '}
                    {t('admin.storesFor')}
                    &ldquo;
                    <span className="font-medium text-foreground">{search}</span>&rdquo;
                  </>
                )}
              </p>
            </motion.div>
          )}

          {/* ─── 5. Store List ──────────────────────────────────────────── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <StoreCardSkeleton key={i} />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-dashed border-neutral-200 py-14 shadow-none">
                <CardContent className="flex flex-col items-center gap-3 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
                    <Store className="size-7 text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{t('admin.noStores')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {search
                        ? t('admin.noStoresDesc')
                        : t('admin.noStoresCreated')}
                    </p>
                  </div>
                  {!search && (
                    <Button
                      size="sm"
                      onClick={() => navigate('admin-store-create')}
                      className="mt-1 gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      {t('admin.createFirst')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div className="space-y-3">
                {stores.map((store, i) => (
                  <motion.div
                    key={store.id}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -20 }}
                    layout
                  >
                    <Card className="border-neutral-100 py-0 shadow-none transition-colors hover:bg-neutral-50/60 cursor-pointer" onClick={() => handleViewStore(store)}>
                      <CardContent className="p-4">
                        {/* Row 1: Store name + badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                                <Building2 className="size-4 text-neutral-500" />
                              </div>
                              <p className="truncate text-sm font-semibold text-neutral-900">
                                {store.name}
                              </p>
                            </div>
                            <div className="ml-10 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="size-3 shrink-0" />
                                <span className="truncate">{store.owner.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="size-3 shrink-0" />
                                <span className="truncate">
                                  {store.city}, {store.state}
                                  {store.country && store.country !== 'India' && `, ${store.country}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">{t('admin.clickToView')} &rarr;</span>
                            <Badge
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                store.isActive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}
                            >
                              {store.isActive ? t('common.active') : t('common.inactive')}
                            </Badge>
                            <Badge
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                store.isOpen
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}
                            >
                              {store.isOpen ? t('common.open') : t('common.closed')}
                            </Badge>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {/* Row 2: Meta info + actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Users className="size-3" />
                              <span className="truncate">{store.owner.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="size-3" />
                              <span>{store.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-3" />
                              <span>{store.workingHours}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Package className="size-3" />
                              <span className="font-medium text-foreground">{store.medicineCount || 0} {t('admin.medicines')}</span>
                            </div>
                          </div>

                          {/* Action buttons - stopPropagation so card click doesn't fire */}
                          <div
                            className="flex items-center gap-3 border-t pt-3 sm:border-t-0 sm:pt-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Toggle Active */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {t('common.active')}
                              </span>
                              <Switch
                                checked={store.isActive}
                                disabled={togglingId === store.id}
                                onCheckedChange={() => handleToggle(store, 'isActive')}
                                className="data-[state=checked]:bg-emerald-600"
                              />
                            </div>

                            {/* Toggle Open */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {t('common.open')}
                              </span>
                              <Switch
                                checked={store.isOpen}
                                disabled={togglingId === store.id}
                                onCheckedChange={() => handleToggle(store, 'isOpen')}
                                className="data-[state=checked]:bg-amber-500"
                              />
                            </div>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(store)}
                            >
                              {deleting && deleteTarget?.id === store.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
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
      </div>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="border-t border-neutral-100 py-6"
      >
        <p className="text-center text-xs text-muted-foreground">
          {t('admin.footer')}
        </p>
      </motion.div>

      {/* ─── Delete Confirmation Dialog ─────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              {t('admin.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteDialog.desc', { name: deleteTarget?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('admin.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t('admin.deleteDialog.deleting')}
                </span>
              ) : (
                t('admin.deleteDialog.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}