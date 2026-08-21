'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Tag,
  Percent,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// Inline fallback translations
const fallback: Record<string, string> = {
  'promotions.title': 'Promotions',
  'promotions.create': 'Create Promotion',
  'promotions.edit': 'Edit Promotion',
  'promotions.active': 'Active Promotions',
  'promotions.expired': 'Expired / Inactive',
  'promotions.name': 'Title',
  'promotions.description': 'Description',
  'promotions.discount': 'Discount %',
  'promotions.promoCode': 'Promo Code',
  'promotions.type': 'Type',
  'promotions.startDate': 'Start Date',
  'promotions.endDate': 'End Date',
  'promotions.save': 'Save',
  'promotions.cancel': 'Cancel',
  'promotions.delete': 'Delete',
  'promotions.deleteWarning': 'Are you sure you want to delete this promotion?',
  'promotions.saved': 'Promotion saved',
  'promotions.saveError': 'Failed to save promotion',
  'promotions.deleted': 'Promotion deleted',
  'promotions.loadError': 'Failed to load promotions',
  'promotions.empty': 'No promotions yet',
  'promotions.emptyDesc': 'Create your first promotion to attract more customers.',
  'promotions.noExpired': 'No expired promotions',
  'promotions.from': 'From',
  'promotions.to': 'To',
}

const sectionFade = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const PROMO_TYPES = ['Discount', 'Flash Sale', 'BOGO', 'Loyalty']

const typeColors: Record<string, string> = {
  Discount: 'bg-emerald-100 text-emerald-700',
  'Flash Sale': 'bg-amber-100 text-amber-700',
  BOGO: 'bg-rose-100 text-rose-700',
  Loyalty: 'bg-violet-100 text-violet-700',
}

interface Promotion {
  id: string
  title: string
  description?: string
  discount: number
  promoCode?: string
  type: string
  startDate: string
  endDate: string
  active: boolean
  createdAt: string
}

const defaultForm = {
  title: '',
  description: '',
  discount: '',
  promoCode: '',
  type: 'Discount',
  startDate: '',
  endDate: '',
}

export default function StorePromotionsScreen() {
  const { user, navigate } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const tf = (key: string) => t(key) || fallback[key] || key

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showExpired, setShowExpired] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchPromotions = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch('/api/store/promotions', {
        headers: { 'X-User-Id': user.id },
      })
      if (res.ok) {
        const data = await res.json()
        setPromotions(Array.isArray(data) ? data : data.promotions || [])
      }
    } catch {
      toast.error(tf('promotions.loadError'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  const openAdd = () => {
    setEditingPromo(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (promo: Promotion) => {
    setEditingPromo(promo)
    setForm({
      title: promo.title,
      description: promo.description || '',
      discount: promo.discount.toString(),
      promoCode: promo.promoCode || '',
      type: promo.type,
      startDate: promo.startDate?.slice(0, 10) || '',
      endDate: promo.endDate?.slice(0, 10) || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !user?.id) return
    setSaving(true)
    try {
      const body = {
        ...(editingPromo ? { id: editingPromo.id } : {}),
        title: form.title.trim(),
        description: form.description.trim() || null,
        discount: parseFloat(form.discount) || 0,
        promoCode: form.promoCode.trim() || null,
        type: form.type,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      }

      const method = editingPromo ? 'PUT' : 'POST'
      const res = await fetch('/api/store/promotions', {
        method,
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(tf('promotions.saved'))
        setDialogOpen(false)
        fetchPromotions()
      } else {
        toast.error(tf('promotions.saveError'))
      }
    } catch {
      toast.error(tf('promotions.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user?.id) return
    setDeleting(true)
    try {
      const res = await fetch('/api/store/promotions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        toast.success(tf('promotions.deleted'))
        setDeleteTarget(null)
      }
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = async (promo: Promotion) => {
    if (!user?.id) return
    setTogglingId(promo.id)
    try {
      const res = await fetch('/api/store/promotions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
        body: JSON.stringify({ id: promo.id, active: !promo.active }),
      })
      if (res.ok) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === promo.id ? { ...p, active: !p.active } : p))
        )
      }
    } catch {
      // silent
    } finally {
      setTogglingId(null)
    }
  }

  const activePromotions = promotions.filter((p) => p.active)
  const expiredPromotions = promotions.filter((p) => !p.active)

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(
        language === 'hi' ? 'hi-IN' : 'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' }
      )
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('store-dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
              <Megaphone className="size-5" />
              {tf('promotions.title')}
            </h1>
          </div>
          <Button onClick={openAdd} className="gap-1.5" size="sm">
            <Plus className="size-4" />
            {tf('promotions.create')}
          </Button>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Active Promotions */}
            <motion.div variants={sectionFade} initial="hidden" animate="visible">
              <h2 className="mb-3 text-sm font-semibold tracking-tight">
                {tf('promotions.active')} ({activePromotions.length})
              </h2>
              {activePromotions.length === 0 ? (
                <Card className="border-dashed border-neutral-200 py-14 shadow-none">
                  <CardContent className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
                      <Megaphone className="size-7 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{tf('promotions.empty')}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{tf('promotions.emptyDesc')}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {activePromotions.map((promo, i) => (
                      <motion.div
                        key={promo.id}
                        custom={i}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -20 }}
                        layout
                      >
                        <Card className="border-neutral-100 py-0 shadow-none transition-colors hover:bg-neutral-50/60">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-neutral-900">{promo.title}</p>
                                  <Badge className="rounded-md bg-emerald-100 px-1.5 py-0 text-[10px] font-semibold text-emerald-700">
                                    <Percent className="mr-0.5 size-2.5" />
                                    {promo.discount}%
                                  </Badge>
                                  <Badge
                                    className={`rounded-md px-1.5 py-0 text-[10px] font-semibold ${typeColors[promo.type] || 'bg-neutral-100 text-neutral-700'}`}
                                  >
                                    {promo.type}
                                  </Badge>
                                </div>
                                {promo.description && (
                                  <p className="mt-1 text-xs text-muted-foreground">{promo.description}</p>
                                )}
                                {promo.promoCode && (
                                  <div className="mt-2 flex items-center gap-1.5">
                                    <Tag className="size-3 text-muted-foreground" />
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-semibold">
                                      {promo.promoCode}
                                    </code>
                                  </div>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  {(promo.startDate || promo.endDate) && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="size-3" />
                                      {promo.startDate && (
                                        <>
                                          {tf('promotions.from')} {formatDate(promo.startDate)}
                                        </>
                                      )}
                                      {promo.endDate && (
                                        <> {tf('promotions.to')} {formatDate(promo.endDate)}</>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={promo.active}
                                    onCheckedChange={() => handleToggle(promo)}
                                    disabled={togglingId === promo.id}
                                    className="scale-75"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => openEdit(promo)}
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => setDeleteTarget(promo)}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </motion.div>

            {/* Expired / Inactive (Collapsible) */}
            {expiredPromotions.length > 0 && (
              <motion.div variants={sectionFade} initial="hidden" animate="visible" className="pb-6">
                <button
                  onClick={() => setShowExpired(!showExpired)}
                  className="mb-3 flex items-center gap-1.5 text-sm font-semibold tracking-tight text-muted-foreground hover:text-foreground"
                >
                  {tf('promotions.expired')} ({expiredPromotions.length})
                  {showExpired ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                <AnimatePresence>
                  {showExpired && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        {expiredPromotions.map((promo, i) => (
                          <motion.div
                            key={promo.id}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                          >
                            <Card className="border-neutral-100 py-0 shadow-none opacity-60">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium text-neutral-700">{promo.title}</p>
                                      <Badge className="rounded-md bg-neutral-100 px-1.5 py-0 text-[10px] font-semibold text-neutral-600">
                                        {promo.discount}%
                                      </Badge>
                                      <Badge
                                        className={`rounded-md px-1.5 py-0 text-[10px] font-semibold ${typeColors[promo.type] || 'bg-neutral-100 text-neutral-700'}`}
                                      >
                                        {promo.type}
                                      </Badge>
                                      <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px]">
                                        Inactive
                                      </Badge>
                                    </div>
                                    {(promo.startDate || promo.endDate) && (
                                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="size-3" />
                                        {promo.startDate && formatDate(promo.startDate)}
                                        {promo.endDate && ` — ${formatDate(promo.endDate)}`}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Switch
                                      checked={promo.active}
                                      onCheckedChange={() => handleToggle(promo)}
                                      disabled={togglingId === promo.id}
                                      className="scale-75"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-muted-foreground hover:text-foreground"
                                      onClick={() => openEdit(promo)}
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => setDeleteTarget(promo)}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? tf('promotions.edit') : tf('promotions.create')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{tf('promotions.name')}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Summer Sale"
              />
            </div>
            <div className="space-y-2">
              <Label>{tf('promotions.description')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your promotion..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{tf('promotions.discount')}</Label>
                <Input
                  type="number"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  placeholder="10"
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label>{tf('promotions.promoCode')}</Label>
                <Input
                  value={form.promoCode}
                  onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
                  placeholder="SUMMER20"
                  className="uppercase"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{tf('promotions.type')}</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map((pt) => (
                    <SelectItem key={pt} value={pt}>
                      {pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{tf('promotions.startDate')}</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{tf('promotions.endDate')}</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tf('promotions.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? '...' : tf('promotions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tf('promotions.delete')} {deleteTarget?.title}?</AlertDialogTitle>
            <AlertDialogDescription>{tf('promotions.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tf('promotions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? '...' : tf('promotions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}