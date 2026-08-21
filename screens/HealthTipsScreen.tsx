'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Heart,
  FileText,
  Clock,
  User,
  TrendingUp,
  Sparkles,
  BookOpen,
  Dumbbell,
  Brain,
  Shield,
  Sun,
  Leaf,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'healthTips.title': 'Health Tips',
  'healthTips.subtitle': 'Stay informed with the latest health articles',
  'healthTips.featured': 'Featured',
  'healthTips.readMore': 'Read More',
  'healthTips.readTime': '{min} min read',
  'healthTips.by': 'By {author}',
  'healthTips.publishedOn': 'Published on {date}',
  'healthTips.empty.title': 'No Articles Found',
  'healthTips.empty.desc': 'There are no articles in this category yet. Check back soon!',
  'healthTips.error': 'Failed to load articles',
  'healthTips.close': 'Close',
  'healthTips.category.all': 'All',
  'healthTips.category.wellness': 'Wellness',
  'healthTips.category.nutrition': 'Nutrition',
  'healthTips.category.exercise': 'Exercise',
  'healthTips.category.seasonal': 'Seasonal',
  'healthTips.category.mentalHealth': 'Mental Health',
  'healthTips.category.prevention': 'Prevention',
}

const categories = [
  { key: 'all', label: 'healthTips.category.all' },
  { key: 'wellness', label: 'healthTips.category.wellness' },
  { key: 'nutrition', label: 'healthTips.category.nutrition' },
  { key: 'exercise', label: 'healthTips.category.exercise' },
  { key: 'seasonal', label: 'healthTips.category.seasonal' },
  { key: 'mentalHealth', label: 'healthTips.category.mentalHealth' },
  { key: 'prevention', label: 'healthTips.category.prevention' },
] as const

const categoryIcons: Record<string, React.ElementType> = {
  wellness: Heart,
  nutrition: Leaf,
  exercise: Dumbbell,
  seasonal: Sun,
  mentalHealth: Brain,
  prevention: Shield,
}

const categoryColors: Record<string, string> = {
  wellness: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  nutrition: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  exercise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  seasonal: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  mentalHealth: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  prevention: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

const featuredGradients = [
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-cyan-600',
]

interface Article {
  id: string
  title: string
  summary: string
  content: string
  category: string
  author: string
  date: string
  readTime: number
  featured: boolean
  gradient?: string
}

function tf(t: (key: string) => string, key: string): string {
  return fallback[key] || t(key)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function HealthTipsScreen() {
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)
  const goBack = useAppStore(s => s.goBack)

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      const res = await fetch(`/api/health-tips?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: Article[] = (data.articles || data || []).map(
        (a: Record<string, unknown>, i: number) => ({
          id: a.id || String(i),
          title: a.title || 'Untitled',
          summary: a.summary || '',
          content: a.content || a.summary || '',
          category: a.category || 'wellness',
          author: a.author || 'Health Team',
          date: a.date || a.createdAt || new Date().toISOString(),
          readTime: a.readTime || 5,
          featured: a.featured || false,
          gradient: featuredGradients[i % featuredGradients.length],
        })
      )
      setArticles(mapped)
    } catch {
      setError(true)
      toast.error(tf(t, 'healthTips.error'))
    } finally {
      setLoading(false)
    }
  }, [activeCategory, t])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const featuredArticle = articles.find(a => a.featured) || articles[0]
  const regularArticles = featuredArticle
    ? articles.filter(a => a.id !== featuredArticle.id)
    : articles

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Button variant="ghost" size="icon" onClick={goBack} className="flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30">
            <Heart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{tf(t, 'healthTips.title')}</h1>
        </div>
      </div>

      <p className="px-4 pb-3 text-sm text-muted-foreground">
        {tf(t, 'healthTips.subtitle')}
      </p>

      {/* Category Tabs */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
        {categories.map(cat => {
          const CatIcon = categoryIcons[cat.key] || FileText
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                activeCategory === cat.key
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {cat.key !== 'all' && <CatIcon className="h-3 w-3" />}
              {tf(t, cat.label)}
            </button>
          )
        })}
      </div>

      <Separator />

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : error || articles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-muted-foreground"
            >
              <div className="rounded-full bg-muted p-4 mb-4">
                <BookOpen className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">{tf(t, 'healthTips.empty.title')}</p>
              <p className="text-sm mt-1 text-center">{tf(t, 'healthTips.empty.desc')}</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Featured Article */}
                {featuredArticle && (
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-0"
                    onClick={() => setSelectedArticle(featuredArticle)}
                  >
                    <div className={cn(
                      'relative h-44 md:h-56 bg-gradient-to-br flex items-end',
                      featuredArticle.gradient || 'from-emerald-500 to-teal-600'
                    )}>
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-foreground hover:bg-white/90 shadow-sm">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {tf(t, 'healthTips.featured')}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          {tf(t, featuredArticle.category ? `healthTips.category.${featuredArticle.category}` : 'healthTips.category.wellness')}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="relative p-4 text-white">
                        <h2 className="text-lg font-bold leading-tight mb-1 line-clamp-2">
                          {featuredArticle.title}
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-white/80">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {featuredArticle.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {tf(t, 'healthTips.readTime').replace('{min}', String(featuredArticle.readTime))}
                          </span>
                          <span>{formatDate(featuredArticle.date)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Regular Articles */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground">Latest Articles</h3>
                  </div>
                  {regularArticles.map((article, index) => {
                    const CatIcon = categoryIcons[article.category] || FileText
                    return (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <Card
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedArticle(article)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
                                categoryColors[article.category] || 'bg-muted text-muted-foreground'
                              )}>
                                <CatIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                    {tf(t, article.category ? `healthTips.category.${article.category}` : 'healthTips.category.wellness')}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    {article.readTime} min
                                  </span>
                                </div>
                                <h4 className="text-sm font-semibold line-clamp-2 leading-snug">
                                  {article.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {article.summary}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                                  <span>{article.author}</span>
                                  <span>•</span>
                                  <span>{formatDate(article.date)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* Article Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {tf(t, selectedArticle.category ? `healthTips.category.${selectedArticle.category}` : 'healthTips.category.wellness')}
                  </Badge>
                  {selectedArticle.featured && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px]">
                      <Sparkles className="h-2.5 w-2.5 mr-1" />
                      {tf(t, 'healthTips.featured')}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-lg leading-tight">{selectedArticle.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 text-xs">
                  <span>{tf(t, 'healthTips.by').replace('{author}', selectedArticle.author)}</span>
                  <span>•</span>
                  <span>{formatDate(selectedArticle.date)}</span>
                  <span>•</span>
                  <span>{tf(t, 'healthTips.readTime').replace('{min}', String(selectedArticle.readTime))}</span>
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
                {selectedArticle.content}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}