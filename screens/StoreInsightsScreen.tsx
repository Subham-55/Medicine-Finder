'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  IndianRupee,
  AlertCircle,
  Package,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'insights.title': 'Customer Insights',
  'insights.topCategories': 'Top Categories',
  'insights.stockSummary': 'Stock Summary',
  'insights.inStock': 'In Stock',
  'insights.outOfStock': 'Out of Stock',
  'insights.priceRange': 'Price Range Analysis',
  'insights.minPrice': 'Min Price',
  'insights.maxPrice': 'Max Price',
  'insights.avgPrice': 'Avg Price',
  'insights.categoryDistribution': 'Category Distribution',
  'insights.missedOpportunities': 'Missed Opportunities',
  'insights.missedDesc': 'Consider adding medicines in these trending categories:',
  'insights.loadError': 'Failed to load insights',
  'insights.noData': 'No data available',
  'insights.medicines': 'medicines',
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

const categoryColors: Record<string, string> = {
  general: 'bg-neutral-500',
  antibiotics: 'bg-emerald-500',
  pain_relief: 'bg-amber-500',
  vitamins: 'bg-orange-500',
  chronic: 'bg-rose-500',
  respiratory: 'bg-sky-500',
  skin: 'bg-pink-500',
  digestive: 'bg-lime-500',
  diabetes: 'bg-blue-500',
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

interface InsightsData {
  topCategories: { category: string; count: number; trend: 'up' | 'down' | 'stable' }[]
  stockSummary: { inStock: number; outOfStock: number; total: number }
  priceRange: { min: number; max: number; avg: number }
  categoryDistribution: { category: string; count: number }[]
  missedOpportunities: { category: string; reason: string; demand: 'high' | 'medium' | 'low' }[]
}

export default function StoreInsightsScreen() {
  const { user, navigate } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const tf = (key: string) => t(key) || fallback[key] || key

  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchInsights = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch('/api/store/insights', {
        headers: { 'X-User-Id': user.id },
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error(tf('insights.loadError'))
      }
    } catch {
      toast.error(tf('insights.loadError'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  const totalStock = data.stockSummary.total || 1
  const inStockPercent = ((data.stockSummary.inStock / totalStock) * 100).toFixed(1)
  const outOfStockPercent = ((data.stockSummary.outOfStock / totalStock) * 100).toFixed(1)

  const maxCatCount = Math.max(
    1,
    ...data.categoryDistribution.map((c) => c.count)
  )

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  }

  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-rose-600',
    stable: 'text-muted-foreground',
  }

  const demandColors: Record<string, string> = {
    high: 'bg-rose-100 text-rose-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-emerald-100 text-emerald-700',
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
              <Lightbulb className="size-5" />
              {tf('insights.title')}
            </h1>
          </div>
        </motion.div>

        {/* Top Categories */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="size-4 text-muted-foreground" />
                {tf('insights.topCategories')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topCategories.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">{tf('insights.noData')}</p>
              ) : (
                <div className="space-y-2">
                  {data.topCategories.map((cat, i) => (
                    <motion.div
                      key={cat.category}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium">
                          {t(categoryKeyMap[cat.category]) || cat.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {cat.count} {tf('insights.medicines')}
                        </span>
                        <span className={`text-xs font-semibold ${trendColors[cat.trend]}`}>
                          {trendIcons[cat.trend]}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stock Summary - Pie-chart-like visual */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Package className="size-4 text-muted-foreground" />
                {tf('insights.stockSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Visual bar representing stock ratio */}
              <div className="mb-4 flex h-8 w-full overflow-hidden rounded-full">
                <motion.div
                  className="flex items-center justify-center bg-emerald-500 text-xs font-semibold text-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${inStockPercent}%` }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {parseFloat(inStockPercent) > 15 && `${inStockPercent}%`}
                </motion.div>
                <motion.div
                  className="flex items-center justify-center bg-rose-500 text-xs font-semibold text-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${outOfStockPercent}%` }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {parseFloat(outOfStockPercent) > 15 && `${outOfStockPercent}%`}
                </motion.div>
              </div>

              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="inline-block size-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">{tf('insights.inStock')}</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
                    {data.stockSummary.inStock}
                  </p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="inline-block size-3 rounded-full bg-rose-500" />
                    <span className="text-xs text-muted-foreground">{tf('insights.outOfStock')}</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-rose-700">
                    {data.stockSummary.outOfStock}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Price Range Analysis */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <IndianRupee className="size-4 text-muted-foreground" />
                {tf('insights.priceRange')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <motion.div
                  custom={0}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="rounded-xl bg-emerald-50 p-4 text-center"
                >
                  <p className="text-xs font-medium text-emerald-600">{tf('insights.minPrice')}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
                    <IndianRupee className="inline size-3.5" />{data.priceRange.min}
                  </p>
                </motion.div>
                <motion.div
                  custom={1}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="rounded-xl bg-amber-50 p-4 text-center"
                >
                  <p className="text-xs font-medium text-amber-600">{tf('insights.maxPrice')}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-amber-700">
                    <IndianRupee className="inline size-3.5" />{data.priceRange.max}
                  </p>
                </motion.div>
                <motion.div
                  custom={2}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="rounded-xl bg-sky-50 p-4 text-center"
                >
                  <p className="text-xs font-medium text-sky-600">{tf('insights.avgPrice')}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-sky-700">
                    <IndianRupee className="inline size-3.5" />{data.priceRange.avg}
                  </p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="size-4 text-muted-foreground" />
                {tf('insights.categoryDistribution')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.categoryDistribution.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">{tf('insights.noData')}</p>
              ) : (
                data.categoryDistribution
                  .sort((a, b) => b.count - a.count)
                  .map((cat) => {
                    const width = (cat.count / maxCatCount) * 100
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">
                            {t(categoryKeyMap[cat.category]) || cat.category}
                          </span>
                          <span className="text-muted-foreground tabular-nums">{cat.count}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className={`h-full rounded-full ${categoryColors[cat.category] || 'bg-neutral-400'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                          />
                        </div>
                      </div>
                    )
                  })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Missed Opportunities */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible" className="pb-6">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-amber-500" />
                {tf('insights.missedOpportunities')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{tf('insights.missedDesc')}</p>
            </CardHeader>
            <CardContent>
              {data.missedOpportunities.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <AlertCircle className="size-6 text-emerald-500" />
                  <p className="text-sm text-muted-foreground">
                    You&apos;re well-stocked across all trending categories!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.missedOpportunities.map((item, i) => (
                    <motion.div
                      key={item.category}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {t(categoryKeyMap[item.category]) || item.category}
                          </p>
                          <Badge
                            className={`rounded-md px-1.5 py-0 text-[10px] font-semibold ${demandColors[item.demand] || 'bg-neutral-100 text-neutral-700'}`}
                          >
                            {item.demand} demand
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}