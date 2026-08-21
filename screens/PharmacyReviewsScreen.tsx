'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  StarHalf,
  Store,
  User,
  Calendar,
  MessageSquare,
  Pencil,
  X,
  Check,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'reviews.title': 'Pharmacy Reviews',
  'reviews.subtitle': 'See what customers are saying',
  'reviews.selectStore': 'Select a Store',
  'reviews.overallRating': 'Overall Rating',
  'reviews.totalReviews': '{count} reviews',
  'reviews.writeReview': 'Write a Review',
  'reviews.submitReview': 'Submit Review',
  'reviews.cancel': 'Cancel',
  'reviews.service': 'Service',
  'reviews.stock': 'Stock Availability',
  'reviews.staff': 'Staff Behavior',
  'reviews.yourReview': 'Your Review',
  'reviews.reviewPlaceholder': 'Share your experience at this pharmacy...',
  'reviews.submitted': 'Review submitted successfully!',
  'reviews.submitError': 'Failed to submit review',
  'reviews.loadError': 'Failed to load reviews',
  'reviews.empty.title': 'No Reviews Yet',
  'reviews.empty.desc': 'Be the first to review this pharmacy!',
  'reviews.noStore.title': 'No Store Selected',
  'reviews.noStore.desc': 'Select a pharmacy to see its reviews',
  'reviews.starBreakdown': 'Rating Breakdown',
  'reviews.verified': 'Verified Purchase',
}

function tf(t: (key: string) => string, key: string, params?: Record<string, string | number>): string {
  let val = fallback[key] || t(key)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v))
    })
  }
  return val
}

function StarRating({ rating, size = 'md', interactive = false, onChange }: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (r: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const sizeMap = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-6 w-6' }
  const iconSize = sizeMap[size]

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= Math.floor(rating) || star <= hovered
        const half = !filled && star === Math.ceil(rating) && rating % 1 >= 0.3
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={cn(
              'transition-colors',
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            )}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onChange?.(star)}
          >
            {filled ? (
              <Star className={cn(iconSize, 'fill-amber-400 text-amber-400')} />
            ) : half ? (
              <StarHalf className={cn(iconSize, 'fill-amber-400 text-amber-400')} />
            ) : (
              <Star className={cn(iconSize, 'text-muted-foreground/30')} />
            )}
          </button>
        )
      })}
    </div>
  )
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-12 text-right text-xs text-muted-foreground">{stars} star</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-amber-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, delay: stars * 0.05 }}
        />
      </div>
      <span className="w-8 text-xs text-muted-foreground">{Math.round(pct)}%</span>
    </div>
  )
}

interface StoreOption {
  id: string
  name: string
  rating: number
}

interface Review {
  id: string
  userName: string
  date: string
  rating: number
  serviceRating: number
  stockRating: number
  staffRating: number
  comment: string
  verified: boolean
}

interface ReviewStats {
  overallRating: number
  totalCount: number
  breakdown: { stars: number; count: number }[]
}

export default function PharmacyReviewsScreen() {
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)
  const goBack = useAppStore(s => s.goBack)
  const selectedPharmacy = useAppStore(s => s.selectedPharmacy)

  const [stores, setStores] = useState<StoreOption[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Write review dialog
  const [writeOpen, setWriteOpen] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newService, setNewService] = useState(0)
  const [newStock, setNewStock] = useState(0)
  const [newStaff, setNewStaff] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews?stores=true')
      if (!res.ok) return
      const data = await res.json()
      setStores(data.stores || [])
      if (selectedPharmacy) {
        setSelectedStoreId(selectedPharmacy.id)
      } else if (data.stores?.[0]?.id) {
        setSelectedStoreId(data.stores[0].id)
      }
    } catch {
      // silent
    }
  }, [selectedPharmacy])

  const fetchReviews = useCallback(async (storeId: string) => {
    if (!storeId) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/reviews?storeId=${storeId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStats(data.stats || null)
      setReviews((data.reviews || []).map((r: Record<string, unknown>) => ({
        id: r.id || String(Math.random()),
        userName: r.userName || r.name || 'Anonymous',
        date: r.date || r.createdAt || new Date().toISOString(),
        rating: r.rating || 0,
        serviceRating: r.serviceRating || r.service || 0,
        stockRating: r.stockRating || r.stock || 0,
        staffRating: r.staffRating || r.staff || 0,
        comment: r.comment || r.review || '',
        verified: r.verified || false,
      })))
    } catch {
      setError(true)
      toast.error(tf(t, 'reviews.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  useEffect(() => {
    if (selectedStoreId) {
      fetchReviews(selectedStoreId)
    }
  }, [selectedStoreId, fetchReviews])

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      toast.error('Please select a rating')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStoreId,
          rating: newRating,
          service: newService,
          stock: newStock,
          staff: newStaff,
          comment: newComment,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(tf(t, 'reviews.submitted'))
      setWriteOpen(false)
      setNewRating(0)
      setNewService(0)
      setNewStock(0)
      setNewStaff(0)
      setNewComment('')
      fetchReviews(selectedStoreId)
    } catch {
      toast.error(tf(t, 'reviews.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedStore = stores.find(s => s.id === selectedStoreId)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Button variant="ghost" size="icon" onClick={goBack} className="flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{tf(t, 'reviews.title')}</h1>
        </div>
      </div>

      {/* Store Selector */}
      <div className="px-4 pb-3">
        {selectedPharmacy ? (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{selectedPharmacy.name}</span>
            <Badge variant="secondary" className="text-[10px]">
              {selectedPharmacy.rating.toFixed(1)} ★
            </Badge>
          </div>
        ) : (
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={tf(t, 'reviews.selectStore')} />
            </SelectTrigger>
            <SelectContent>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>
                  <div className="flex items-center gap-2">
                    <span>{store.name}</span>
                    <span className="text-muted-foreground text-xs">{store.rating.toFixed(1)} ★</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {!selectedStoreId ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-muted-foreground"
            >
              <div className="rounded-full bg-muted p-4 mb-4">
                <Store className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">{tf(t, 'reviews.noStore.title')}</p>
              <p className="text-sm mt-1">{tf(t, 'reviews.noStore.desc')}</p>
            </motion.div>
          ) : loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : error || !stats ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-muted-foreground"
            >
              <p className="text-lg font-medium">{tf(t, 'reviews.empty.title')}</p>
              <p className="text-sm mt-1">{tf(t, 'reviews.empty.desc')}</p>
            </motion.div>
          ) : (
            <>
              {/* Overall Rating Card */}
              <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <motion.div
                        className="text-5xl font-bold text-amber-600 dark:text-amber-400"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      >
                        {stats.overallRating.toFixed(1)}
                      </motion.div>
                      <StarRating rating={stats.overallRating} size="md" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {tf(t, 'reviews.totalReviews', { count: stats.totalCount })}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                        {tf(t, 'reviews.starBreakdown')}
                      </h3>
                      {[5, 4, 3, 2, 1].map(star => {
                        const found = stats.breakdown.find(b => b.stars === star)
                        return (
                          <RatingBar
                            key={star}
                            stars={star}
                            count={found?.count || 0}
                            total={stats.totalCount}
                          />
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Write Review Button */}
              <Button
                className="w-full"
                onClick={() => setWriteOpen(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {tf(t, 'reviews.writeReview')}
              </Button>

              {/* Reviews List */}
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">{tf(t, 'reviews.empty.title')}</p>
                    <p className="text-xs mt-1">{tf(t, 'reviews.empty.desc')}</p>
                  </div>
                ) : (
                  reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold">{review.userName}</span>
                                  {review.verified && (
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                      {tf(t, 'reviews.verified')}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            <StarRating rating={review.rating} size="sm" />
                          </div>

                          {/* Sub-ratings */}
                          <div className="flex items-center gap-3 mb-2 text-[11px] text-muted-foreground">
                            <span>Service: {review.serviceRating}/5</span>
                            <span>Stock: {review.stockRating}/5</span>
                            <span>Staff: {review.staffRating}/5</span>
                          </div>

                          {review.comment && (
                            <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Write Review Dialog */}
      <Dialog open={writeOpen} onOpenChange={setWriteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tf(t, 'reviews.writeReview')}</DialogTitle>
            <DialogDescription>
              {selectedStore?.name || selectedPharmacy?.name || ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Overall Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Overall Rating</label>
              <StarRating
                rating={newRating}
                size="lg"
                interactive
                onChange={setNewRating}
              />
            </div>

            <Separator />

            {/* Sub-ratings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{tf(t, 'reviews.service')}</span>
                <StarRating rating={newService} size="sm" interactive onChange={setNewService} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{tf(t, 'reviews.stock')}</span>
                <StarRating rating={newStock} size="sm" interactive onChange={setNewStock} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{tf(t, 'reviews.staff')}</span>
                <StarRating rating={newStaff} size="sm" interactive onChange={setNewStaff} />
              </div>
            </div>

            <Separator />

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{tf(t, 'reviews.yourReview')}</label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={tf(t, 'reviews.reviewPlaceholder')}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWriteOpen(false)}>
              {tf(t, 'reviews.cancel')}
            </Button>
            <Button onClick={handleSubmitReview} disabled={submitting || newRating === 0}>
              {submitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {tf(t, 'reviews.submitReview')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}