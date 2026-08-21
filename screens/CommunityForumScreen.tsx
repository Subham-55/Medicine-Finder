'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  MessageCircle,
  Plus,
  Pin,
  MessageSquare,
  User,
  Calendar,
  Tag,
  Bot,
  Award,
  ArrowRight,
  X,
  Send,
  ChevronLeft,
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
  'forum.title': 'Community Forum',
  'forum.subtitle': 'Ask questions, share experiences, help others',
  'forum.askQuestion': 'Ask a Question',
  'forum.postQuestion': 'Post Question',
  'forum.cancel': 'Cancel',
  'forum.titlePlaceholder': 'What is your question about?',
  'forum.contentPlaceholder': 'Provide details about your question...',
  'forum.category': 'Category',
  'forum.tags': 'Tags (comma separated)',
  'forum.tagsPlaceholder': 'e.g. headache, ibuprofen, side effects',
  'forum.replies': '{count} replies',
  'forum.reply': 'Reply',
  'forum.submitted': 'Question posted successfully!',
  'forum.submitError': 'Failed to post question',
  'forum.loadError': 'Failed to load forum posts',
  'forum.empty.title': 'No Questions Yet',
  'forum.empty.desc': 'Be the first to ask a question in the community!',
  'forum.aiAnswer': 'AI Answer',
  'forum.bestAnswer': 'Best Answer',
  'forum.pinned': 'Pinned',
  'forum.backToPosts': 'Back to Posts',
  'forum.noReplies': 'No replies yet. Be the first to answer!',
  'forum.category.all': 'All',
  'forum.category.general': 'General',
  'forum.category.medicine': 'Medicine',
  'forum.category.health': 'Health',
  'forum.category.prescription': 'Prescription',
  'forum.category.sideEffects': 'Side Effects',
}

const categories = [
  { key: 'all', label: 'forum.category.all' },
  { key: 'general', label: 'forum.category.general' },
  { key: 'medicine', label: 'forum.category.medicine' },
  { key: 'health', label: 'forum.category.health' },
  { key: 'prescription', label: 'forum.category.prescription' },
  { key: 'sideEffects', label: 'forum.category.sideEffects' },
] as const

const categoryColors: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medicine: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  health: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  prescription: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  sideEffects: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / (1000 * 60))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  category: string
  tags: string[]
  replyCount: number
  date: string
  pinned: boolean
}

interface ForumReply {
  id: string
  author: string
  content: string
  date: string
  isAI: boolean
  isBest: boolean
}

export default function CommunityForumScreen() {
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)
  const goBack = useAppStore(s => s.goBack)

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Post detail view
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)

  // Ask question dialog
  const [askOpen, setAskOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [newTags, setNewTags] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      const res = await fetch(`/api/forum?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPosts((data.posts || data || []).map((p: Record<string, unknown>) => ({
        id: p.id || String(Math.random()),
        title: p.title || 'Untitled',
        content: p.content || '',
        author: p.author || p.userName || 'Anonymous',
        category: p.category || 'general',
        tags: p.tags || [],
        replyCount: p.replyCount || 0,
        date: p.date || p.createdAt || new Date().toISOString(),
        pinned: p.pinned || false,
      })))
    } catch {
      setError(true)
      toast.error(tf(t, 'forum.loadError'))
    } finally {
      setLoading(false)
    }
  }, [activeCategory, t])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const fetchPostDetail = useCallback(async (postId: string) => {
    setLoadingReplies(true)
    try {
      const res = await fetch(`/api/forum/${postId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const post = data.post || data
      setSelectedPost({
        id: post.id,
        title: post.title,
        content: post.content || '',
        author: post.author || 'Anonymous',
        category: post.category || 'general',
        tags: post.tags || [],
        replyCount: post.replyCount || 0,
        date: post.date || post.createdAt || new Date().toISOString(),
        pinned: post.pinned || false,
      })
      setReplies((data.replies || []).map((r: Record<string, unknown>) => ({
        id: r.id || String(Math.random()),
        author: r.author || r.userName || 'Anonymous',
        content: r.content || '',
        date: r.date || r.createdAt || new Date().toISOString(),
        isAI: r.isAI || false,
        isBest: r.isBest || false,
      })))
    } catch {
      toast.error(tf(t, 'forum.loadError'))
    } finally {
      setLoadingReplies(false)
    }
  }, [t])

  const handlePostClick = (post: ForumPost) => {
    fetchPostDetail(post.id)
  }

  const handleSubmitQuestion = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a title')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(tf(t, 'forum.submitted'))
      setAskOpen(false)
      setNewTitle('')
      setNewContent('')
      setNewCategory('general')
      setNewTags('')
      fetchPosts()
    } catch {
      toast.error(tf(t, 'forum.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const pinnedPosts = posts.filter(p => p.pinned)
  const regularPosts = posts.filter(p => !p.pinned)

  // Post detail view
  if (selectedPost) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)} className="flex-shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight flex-1 truncate">{selectedPost.title}</h1>
        </div>
        <Separator />

        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-4">
            {loadingReplies ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-lg" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {/* Post Content */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={categoryColors[selectedPost.category] || categoryColors.general}>
                        {tf(t, `forum.category.${selectedPost.category}`)}
                      </Badge>
                      {selectedPost.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{selectedPost.content}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {selectedPost.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {timeAgo(selectedPost.date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Replies */}
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {tf(t, 'forum.replies', { count: replies.length })}
                  </h3>
                  {replies.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{tf(t, 'forum.noReplies')}</p>
                    </div>
                  ) : (
                    replies.map((reply, index) => (
                      <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <Card className="overflow-hidden">
                          {reply.isBest && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 px-4 py-1.5 flex items-center gap-1.5">
                              <Award className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                {tf(t, 'forum.bestAnswer')}
                              </span>
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0',
                                reply.isAI
                                  ? 'bg-violet-100 dark:bg-violet-900/30'
                                  : 'bg-muted'
                              )}>
                                {reply.isAI ? (
                                  <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-sm font-semibold">{reply.author}</span>
                                  {reply.isAI && (
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                      <Bot className="h-2.5 w-2.5 mr-0.5" />
                                      {tf(t, 'forum.aiAnswer')}
                                    </Badge>
                                  )}
                                  <span className="text-[11px] text-muted-foreground">{timeAgo(reply.date)}</span>
                                </div>
                                <p className="text-sm text-foreground/85 leading-relaxed">{reply.content}</p>
                              </div>
                            </div>
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
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{tf(t, 'forum.title')}</h1>
          </div>
        </div>
        <Button size="sm" onClick={() => setAskOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">{tf(t, 'forum.askQuestion')}</span>
        </Button>
      </div>

      <p className="px-4 pb-3 text-sm text-muted-foreground">
        {tf(t, 'forum.subtitle')}
      </p>

      {/* Category Tabs */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
              activeCategory === cat.key
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {tf(t, cat.label)}
          </button>
        ))}
      </div>

      <Separator />

      {/* Posts List */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : error || posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-muted-foreground"
            >
              <div className="rounded-full bg-muted p-4 mb-4">
                <MessageCircle className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">{tf(t, 'forum.empty.title')}</p>
              <p className="text-sm mt-1">{tf(t, 'forum.empty.desc')}</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Pinned Posts */}
                {pinnedPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow border-l-2 border-l-amber-400"
                      onClick={() => handlePostClick(post)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Pin className="h-3 w-3 text-amber-500" />
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                                {tf(t, 'forum.pinned')}
                              </Badge>
                              <Badge className={cn('text-[10px]', categoryColors[post.category] || categoryColors.general)}>
                                {tf(t, `forum.category.${post.category}`)}
                              </Badge>
                            </div>
                            <h4 className="text-sm font-semibold line-clamp-2 leading-snug mb-1">
                              {post.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">{post.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                              <span>{post.author}</span>
                              <span>•</span>
                              <span>{timeAgo(post.date)}</span>
                              {post.replyCount > 0 && (
                                <span className="flex items-center gap-0.5 font-medium">
                                  <MessageSquare className="h-3 w-3" />
                                  {post.replyCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Regular Posts */}
                {regularPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (pinnedPosts.length + index) * 0.05, duration: 0.3 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handlePostClick(post)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className={cn('text-[10px]', categoryColors[post.category] || categoryColors.general)}>
                                {tf(t, `forum.category.${post.category}`)}
                              </Badge>
                              {post.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-[9px]">
                                  <Tag className="h-2 w-2 mr-0.5" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <h4 className="text-sm font-semibold line-clamp-2 leading-snug mb-1">
                              {post.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">{post.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                              <span>{post.author}</span>
                              <span>•</span>
                              <span>{timeAgo(post.date)}</span>
                              {post.replyCount > 0 && (
                                <span className="flex items-center gap-0.5 font-medium">
                                  <MessageSquare className="h-3 w-3" />
                                  {tf(t, 'forum.replies', { count: post.replyCount })}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* Ask Question Dialog */}
      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tf(t, 'forum.askQuestion')}</DialogTitle>
            <DialogDescription>{tf(t, 'forum.subtitle')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={tf(t, 'forum.titlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={tf(t, 'forum.contentPlaceholder')}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{tf(t, 'forum.category')}</label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.key !== 'all').map(cat => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {tf(t, cat.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{tf(t, 'forum.tags')}</label>
              <Input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder={tf(t, 'forum.tagsPlaceholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAskOpen(false)}>
              {tf(t, 'forum.cancel')}
            </Button>
            <Button onClick={handleSubmitQuestion} disabled={submitting || !newTitle.trim()}>
              {submitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              {tf(t, 'forum.postQuestion')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}