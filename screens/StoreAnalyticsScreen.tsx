'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  Package,
  CheckCircle,
  XCircle,
  IndianRupee,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'analytics.title': 'Store Analytics',
  'analytics.totalMedicines': 'Total Medicines',
  'analytics.inStock': 'In Stock',
  'analytics.outOfStock': 'Out of Stock',
  'analytics.avgPrice': 'Avg Price',
  'analytics.lowStockAlerts': 'Low Stock Alerts',
  'analytics.lowStockDesc': 'Medicines with stock below 10 units',
  'analytics.medicine': 'Medicine',
  'analytics.stock': 'Stock',
  'analytics.category': 'Category',
  'analytics.action': 'Action',
  'analytics.reorder': 'Reorder',
  'analytics.categoryDistribution': 'Category Distribution',
  'analytics.recentAdditions': 'Recent Additions',
  'analytics.last7Days': 'Last 7 Days',
  'analytics.loadError': 'Failed to load analytics',
  'analytics.noData': 'No data available',
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
  general: 'bg-neutral-400',
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

interface AnalyticsData {
  totalMedicines: number
  inStock: number
  outOfStock: number
  avgPrice: number
  lowStock: { id: string; name: string; stock: number; category: string }[]
  categoryDistribution: { category: string; count: number }[]
  recentAdditions: { id: string; name: string; category: string; price: number; createdAt: string }[]
}

export default function StoreAnalyticsScreen() {
  const { user, navigate } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const tf = (key: string) => t(key) || fallback[key] || key

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch('/api/store/analytics', {
        headers: { 'X-User-Id': user.id },
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error(tf('analytics.loadError'))
      }
    } catch {
      toast.error(tf('analytics.loadError'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9" />
            <Skeleton className="h-7 w-40" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  const maxCategoryCount = Math.max(
    1,
    ...data.categoryDistribution.map((c) => c.count)
  )

  const stats = [
    {
      label: tf('analytics.totalMedicines'),
      value: data.totalMedicines,
      icon: Package,
      color: 'text-neutral-700',
      bg: 'bg-neutral-100',
    },
    {
      label: tf('analytics.inStock'),
      value: data.inStock,
      icon: CheckCircle,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
    },
    {
      label: tf('analytics.outOfStock'),
      value: data.outOfStock,
      icon: XCircle,
      color: 'text-rose-700',
      bg: 'bg-rose-100',
    },
    {
      label: tf('analytics.avgPrice'),
      value: `₹${data.avgPrice.toFixed(0)}`,
      icon: IndianRupee,
      color: 'text-amber-700',
      bg: 'bg-amber-100',
    },
  ]

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
              <BarChart3 className="size-5" />
              {tf('analytics.title')}
            </h1>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {stats.map((stat, i) => (
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

        {/* Low Stock Alerts */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4 text-amber-500" />
                {tf('analytics.lowStockAlerts')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{tf('analytics.lowStockDesc')}</p>
            </CardHeader>
            <CardContent>
              {data.lowStock.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">{tf('analytics.noData')}</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tf('analytics.medicine')}</TableHead>
                        <TableHead className="w-20 text-center">{tf('analytics.stock')}</TableHead>
                        <TableHead>{tf('analytics.category')}</TableHead>
                        <TableHead className="w-24 text-right">{tf('analytics.action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.lowStock.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="destructive"
                              className="rounded-md px-1.5 py-0 text-[10px] font-semibold"
                            >
                              {item.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {t(categoryKeyMap[item.category]) || item.category}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                              <RotateCcw className="size-3" />
                              {tf('analytics.reorder')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="size-4 text-muted-foreground" />
                {tf('analytics.categoryDistribution')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.categoryDistribution.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">{tf('analytics.noData')}</p>
              ) : (
                data.categoryDistribution
                  .sort((a, b) => b.count - a.count)
                  .map((cat) => {
                    const width = (cat.count / maxCategoryCount) * 100
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

        {/* Recent Additions */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible" className="pb-6">
          <Card className="border-neutral-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Package className="size-4 text-muted-foreground" />
                {tf('analytics.recentAdditions')}
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {tf('analytics.last7Days')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentAdditions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">{tf('analytics.noData')}</p>
              ) : (
                <div className="space-y-2">
                  {data.recentAdditions.map((med, i) => (
                    <motion.div
                      key={med.id}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{med.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(categoryKeyMap[med.category]) || med.category}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          <IndianRupee className="inline size-3" />{med.price}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{med.createdAt}</p>
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