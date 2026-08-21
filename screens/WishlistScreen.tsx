'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Heart,
  Search,
  Trash2,
  Pill,
  Tag,
  Clock,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'wishlist.title': 'My Wishlist',
  'wishlist.empty': 'No saved medicines yet',
  'wishlist.emptyDesc': 'Search for medicines and save them here for quick access later.',
  'wishlist.search': 'Search',
  'wishlist.remove': 'Remove',
  'wishlist.removed': 'Medicine removed from wishlist',
  'wishlist.removeError': 'Failed to remove medicine',
  'wishlist.loadError': 'Failed to load wishlist',
  'wishlist.dateAdded': 'Added',
  'wishlist.genericName': 'Generic',
  'wishlist.dosage': 'Dosage',
  'wishlist.notes': 'Notes',
}

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

interface WishlistItem {
  id: string
  userId: string
  medicineName: string
  genericName?: string
  category?: string
  dosage?: string
  notes?: string
  createdAt: string
}

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

export default function WishlistScreen() {
  const { user, navigate, goBack, setSearchQuery } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const tf = (key: string) => t(key) || fallback[key] || key

  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchWishlist = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/wishlist?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setItems(Array.isArray(data) ? data : data.items || [])
      }
    } catch {
      toast.error(tf('wishlist.loadError'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const handleRemove = async (item: WishlistItem) => {
    setRemoving(item.id)
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, userId: user?.id }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((w) => w.id !== item.id))
        toast.success(tf('wishlist.removed'))
      } else {
        toast.error(tf('wishlist.removeError'))
      }
    } catch {
      toast.error(tf('wishlist.removeError'))
    } finally {
      setRemoving(null)
    }
  }

  const handleSearch = (name: string) => {
    setSearchQuery(name)
    navigate('search')
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
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
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
              <Heart className="size-5 text-rose-500" />
              {tf('wishlist.title')}
            </h1>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-dashed border-neutral-200 py-16 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-50">
                  <Heart className="size-8 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{tf('wishlist.empty')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tf('wishlist.emptyDesc')}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('search')}
                  className="mt-2 gap-1.5"
                >
                  <Search className="size-3.5" />
                  {tf('wishlist.search')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  layout
                >
                  <Card className="border-neutral-100 py-0 shadow-none transition-colors hover:bg-neutral-50/60">
                    <CardContent className="p-4">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Pill className="size-4 shrink-0 text-muted-foreground" />
                            <p className="truncate text-sm font-semibold text-neutral-900">
                              {item.medicineName}
                            </p>
                          </div>
                          {item.genericName && (
                            <p className="mt-0.5 pl-6 truncate text-xs text-muted-foreground">
                              {item.genericName}
                            </p>
                          )}
                        </div>
                        {item.category && (
                          <Badge
                            className={`shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold ${categoryColors[item.category] || 'bg-neutral-100 text-neutral-700'}`}
                          >
                            {item.category}
                          </Badge>
                        )}
                      </div>

                      {/* Details */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pl-6 text-xs text-muted-foreground">
                        {item.dosage && (
                          <span className="flex items-center gap-1">
                            <Tag className="size-3" />
                            {item.dosage}
                          </span>
                        )}
                        {item.notes && (
                          <span className="flex items-center gap-1">
                            <FileText className="size-3" />
                            {item.notes.length > 30 ? item.notes.slice(0, 30) + '…' : item.notes}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {tf('wishlist.dateAdded')} {formatDate(item.createdAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearch(item.medicineName)}
                          className="h-8 gap-1.5 text-xs"
                        >
                          <Search className="size-3" />
                          {tf('wishlist.search')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(item)}
                          disabled={removing === item.id}
                          className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                          {tf('wishlist.remove')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}