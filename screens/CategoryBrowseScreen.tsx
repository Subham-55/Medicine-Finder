'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  LayoutGrid,
  Pill,
  Shield,
  Sun,
  Droplets,
  Heart,
  Sparkles,
  Wind,
  Leaf,
  Eye,
  Flower2,
  Brain,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'categoryBrowse.title': 'Browse Categories',
  'categoryBrowse.medicines': 'medicines',
  'categoryBrowse.loadError': 'Failed to load categories',
  'category.painRelief': 'Pain Relief',
  'category.antibiotics': 'Antibiotics',
  'category.vitamins': 'Vitamins',
  'category.diabetes': 'Diabetes',
  'category.heartCare': 'Heart Care',
  'category.skinCare': 'Skin Care',
  'category.coldFlu': 'Cold & Flu',
  'category.digestive': 'Digestive',
  'category.eyeEar': 'Eye & Ear',
  'category.allergy': 'Allergy',
  'category.mentalHealth': 'Mental Health',
  'category.general': 'General',
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
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

interface CategoryDef {
  key: string
  labelKey: string
  icon: React.ElementType
  bgClass: string
  iconColor: string
  value: string
}

const CATEGORIES: CategoryDef[] = [
  { key: 'pain_relief', labelKey: 'category.painRelief', icon: Pill, bgClass: 'bg-red-50', iconColor: 'text-red-600', value: 'pain_relief' },
  { key: 'antibiotics', labelKey: 'category.antibiotics', icon: Shield, bgClass: 'bg-emerald-50', iconColor: 'text-emerald-600', value: 'antibiotics' },
  { key: 'vitamins', labelKey: 'category.vitamins', icon: Sun, bgClass: 'bg-amber-50', iconColor: 'text-amber-600', value: 'vitamins' },
  { key: 'diabetes', labelKey: 'category.diabetes', icon: Droplets, bgClass: 'bg-sky-50', iconColor: 'text-sky-600', value: 'diabetes' },
  { key: 'chronic', labelKey: 'category.heartCare', icon: Heart, bgClass: 'bg-rose-50', iconColor: 'text-rose-600', value: 'chronic' },
  { key: 'skin', labelKey: 'category.skinCare', icon: Sparkles, bgClass: 'bg-purple-50', iconColor: 'text-purple-600', value: 'skin' },
  { key: 'respiratory', labelKey: 'category.coldFlu', icon: Wind, bgClass: 'bg-cyan-50', iconColor: 'text-cyan-600', value: 'respiratory' },
  { key: 'digestive', labelKey: 'category.digestive', icon: Leaf, bgClass: 'bg-lime-50', iconColor: 'text-lime-600', value: 'digestive' },
  { key: 'eye_ear', labelKey: 'category.eyeEar', icon: Eye, bgClass: 'bg-teal-50', iconColor: 'text-teal-600', value: 'eye_ear' },
  { key: 'allergy', labelKey: 'category.allergy', icon: Flower2, bgClass: 'bg-pink-50', iconColor: 'text-pink-600', value: 'allergy' },
  { key: 'mental_health', labelKey: 'category.mentalHealth', icon: Brain, bgClass: 'bg-violet-50', iconColor: 'text-violet-600', value: 'mental_health' },
  { key: 'general', labelKey: 'category.general', icon: Package, bgClass: 'bg-neutral-50', iconColor: 'text-neutral-600', value: 'general' },
]

export default function CategoryBrowseScreen() {
  const { goBack, setSearchQuery, navigate } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const tf = (key: string) => t(key) || fallback[key] || key

  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, number> = {}
        const list = Array.isArray(data) ? data : data.categories || []
        list.forEach((c: { key?: string; name?: string; count?: number; medicineCount?: number }) => {
          const count = c.count ?? c.medicineCount ?? 0
          if (c.key) map[c.key] = count
          else if (c.name) map[c.name.toLowerCase().replace(/\s+/g, '_')] = count
        })
        setCounts(map)
      }
    } catch {
      // silent — show zeros
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCategoryClick = (cat: CategoryDef) => {
    setSearchQuery('')
    navigate('search')
    // Store the category for pre-filtering
    sessionStorage.setItem('preselectedCategory', cat.value)
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
              <LayoutGrid className="size-5" />
              {tf('categoryBrowse.title')}
            </h1>
          </div>
        </motion.div>

        {/* Category Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon
              const count = counts[cat.key] ?? 0
              return (
                <motion.div
                  key={cat.key}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                >
                  <Card
                    className={`cursor-pointer border-neutral-100 py-0 shadow-none transition-all hover:shadow-md active:scale-[0.98] ${cat.bgClass}`}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <div className={`flex size-11 items-center justify-center rounded-xl bg-white/80 ${cat.iconColor}`}>
                        <Icon className="size-5" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-900">{tf(cat.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} {tf('categoryBrowse.medicines')}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}