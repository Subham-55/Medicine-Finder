'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Pill,
  Clock,
  AlertTriangle,
  MapPin,
  Bell,
  Navigation,
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
  'refill.title': 'Refill Tracker',
  'refill.tabMyMedicines': 'My Medicines',
  'refill.tabLowStock': 'Low Stock Alerts',
  'refill.findNearby': 'Find Nearby',
  'refill.setReminder': 'Set Refill Reminder',
  'refill.lastSearched': 'Last searched',
  'refill.nearbyStock': 'Nearby stores with stock',
  'refill.noMedicines': 'No medicines tracked yet',
  'refill.noMedicinesDesc': 'Search for medicines to start tracking them here.',
  'refill.noAlerts': 'No low stock alerts',
  'refill.noAlertsDesc': 'All tracked medicines have sufficient stock nearby.',
  'refill.reminderSet': 'Refill reminder set!',
  'refill.reminderError': 'Failed to set reminder',
  'refill.loadError': 'Failed to load data',
  'refill.stock': 'stock',
  'refill.km': 'km',
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

type TabValue = 'my-medicines' | 'low-stock'

interface TrackedMedicine {
  name: string
  lastSearched?: string
  nearbyStores: { name: string; stock: number; distance: number }[]
}

interface LowStockAlert {
  name: string
  minStock: number
  stores: { name: string; stock: number; distance: number }[]
}

export default function RefillTrackerScreen() {
  const { user, goBack, navigate, setSearchQuery, currentLocation } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const tf = (key: string) => t(key) || fallback[key] || key

  const [activeTab, setActiveTab] = useState<TabValue>('my-medicines')
  const [myMedicines, setMyMedicines] = useState<TrackedMedicine[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [settingReminder, setSettingReminder] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      // Fetch tracked medicines / reminders
      const res = await fetch(`/api/reminders?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.reminders || []
        const tracked: TrackedMedicine[] = list.map((r: any) => ({
          name: r.medicineName || r.name || '',
          lastSearched: r.lastSearched || r.createdAt,
          nearbyStores: r.nearbyStores || [],
        }))
        setMyMedicines(tracked)

        // Derive low stock alerts from nearby stores data
        const alerts: LowStockAlert[] = []
        tracked.forEach((med) => {
          if (med.nearbyStores.length > 0) {
            const minStock = Math.min(...med.nearbyStores.map((s) => s.stock))
            if (minStock < 5) {
              alerts.push({
                name: med.name,
                minStock,
                stores: med.nearbyStores
                  .sort((a, b) => a.stock - b.stock)
                  .slice(0, 3),
              })
            }
          }
        })
        setLowStockAlerts(alerts)
      }
    } catch {
      toast.error(tf('refill.loadError'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFindNearby = (name: string) => {
    setSearchQuery(name)
    navigate('search')
  }

  const handleSetReminder = async (name: string) => {
    if (!user?.id) return
    setSettingReminder(name)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          medicineName: name,
          type: 'refill',
        }),
      })
      if (res.ok) {
        toast.success(tf('refill.reminderSet'))
      } else {
        toast.error(tf('refill.reminderError'))
      }
    } catch {
      toast.error(tf('refill.reminderError'))
    } finally {
      setSettingReminder(null)
    }
  }

  const getStockColor = (stock: number) => {
    if (stock < 3) return 'text-red-600 bg-red-50'
    if (stock < 5) return 'text-amber-600 bg-amber-50'
    return 'text-emerald-600 bg-emerald-50'
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(
        language === 'hi' ? 'hi-IN' : 'en-US',
        { month: 'short', day: 'numeric' }
      )
    } catch {
      return dateStr
    }
  }

  const tabs: { value: TabValue; label: string; count: number }[] = [
    { value: 'my-medicines', label: tf('refill.tabMyMedicines'), count: myMedicines.length },
    { value: 'low-stock', label: tf('refill.tabLowStock'), count: lowStockAlerts.length },
  ]

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
              <RefreshCw className="size-5" />
              {tf('refill.title')}
            </h1>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible" className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                activeTab === tab.value
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  variant={activeTab === tab.value ? 'secondary' : 'outline'}
                  className={`ml-1.5 px-1.5 py-0 text-[10px] ${
                    activeTab === tab.value
                      ? 'bg-white/20 text-white'
                      : ''
                  }`}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : activeTab === 'my-medicines' ? (
          myMedicines.length === 0 ? (
            <Card className="border-dashed border-neutral-200 py-14 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
                  <Pill className="size-7 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{tf('refill.noMedicines')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tf('refill.noMedicinesDesc')}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('search')}
                  className="mt-2 gap-1.5"
                >
                  <Search className="size-3.5" />
                  {tf('refill.findNearby')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {myMedicines.map((med, i) => (
                <motion.div
                  key={med.name}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="border-neutral-100 py-0 shadow-none transition-colors hover:bg-neutral-50/60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Pill className="size-4 shrink-0 text-muted-foreground" />
                            <p className="truncate text-sm font-semibold text-neutral-900">{med.name}</p>
                          </div>
                          {med.lastSearched && (
                            <p className="mt-0.5 pl-6 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3" />
                              {tf('refill.lastSearched')} {formatDate(med.lastSearched)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFindNearby(med.name)}
                          className="shrink-0 h-8 gap-1.5 text-xs"
                        >
                          <MapPin className="size-3" />
                          {tf('refill.findNearby')}
                        </Button>
                      </div>

                      {/* Nearby stores mini list */}
                      {med.nearbyStores.length > 0 && (
                        <div className="mt-3 space-y-1.5 rounded-lg bg-muted/50 px-3 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {tf('refill.nearbyStock')}
                          </p>
                          {med.nearbyStores.slice(0, 3).map((store, si) => (
                            <div
                              key={si}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="truncate text-muted-foreground">{store.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getStockColor(store.stock)}`}>
                                  {store.stock} {tf('refill.stock')}
                                </span>
                                {store.distance != null && (
                                  <span className="flex items-center gap-0.5 text-muted-foreground">
                                    <Navigation className="size-2.5" />
                                    {store.distance.toFixed(1)} {tf('refill.km')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )
        ) : /* Low Stock Alerts Tab */
        lowStockAlerts.length === 0 ? (
          <Card className="border-dashed border-neutral-200 py-14 shadow-none">
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50">
                <AlertTriangle className="size-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">{tf('refill.noAlerts')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tf('refill.noAlertsDesc')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {lowStockAlerts.map((alert, i) => (
              <motion.div
                key={alert.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <Card className="border-neutral-100 py-0 shadow-none transition-colors hover:bg-neutral-50/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Pill className="size-4 shrink-0 text-muted-foreground" />
                          <p className="truncate text-sm font-semibold text-neutral-900">{alert.name}</p>
                          <Badge
                            className={`shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold ${getStockColor(alert.minStock)}`}
                          >
                            {alert.minStock} {tf('refill.stock')}
                          </Badge>
                        </div>

                        <div className="mt-2 space-y-1">
                          {alert.stores.map((store, si) => (
                            <div
                              key={si}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="truncate text-muted-foreground">{store.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getStockColor(store.stock)}`}>
                                  {store.stock} {tf('refill.stock')}
                                </span>
                                {store.distance != null && (
                                  <span className="flex items-center gap-0.5 text-muted-foreground">
                                    <Navigation className="size-2.5" />
                                    {store.distance.toFixed(1)} {tf('refill.km')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetReminder(alert.name)}
                        disabled={settingReminder === alert.name}
                        className="h-8 gap-1.5 text-xs"
                      >
                        <Bell className="size-3" />
                        {settingReminder === alert.name ? '...' : tf('refill.setReminder')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}