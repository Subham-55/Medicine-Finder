'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  BellOff,
  Trash2,
  Check,
  Package,
  TrendingDown,
  Store,
  Gift,
  Megaphone,
  Clock,
} from 'lucide-react'

function getRelativeTime(isoString: string, t: (key: string) => string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / (1000 * 60))
  if (minutes < 60) return t('notifications.time.minutesAgo').replace('{count}', String(minutes))

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('notifications.time.hoursAgo').replace('{count}', String(hours))

  const days = Math.floor(hours / 24)
  return t('notifications.time.daysAgo').replace('{count}', String(days))
}

function getNotificationIcon(type: string, t: (key: string) => string) {
  switch (type) {
    case 'availability':
      return { icon: Package, color: 'bg-green-500', label: t('notifications.type.availability') }
    case 'price':
      return { icon: TrendingDown, color: 'bg-emerald-500', label: t('notifications.type.price') }
    case 'store':
      return { icon: Store, color: 'bg-blue-500', label: t('notifications.type.store') }
    case 'offer':
      return { icon: Gift, color: 'bg-amber-500', label: t('notifications.type.offer') }
    case 'app':
      return { icon: Megaphone, color: 'bg-gray-400', label: t('notifications.type.app') }
    default:
      return { icon: Bell, color: 'bg-gray-400', label: t('notifications.type.info') }
  }
}

type FilterTab = 'all' | 'unread'

export default function NotificationsScreen() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useAppStore()

  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const [filter, setFilter] = useState<FilterTab>('all')

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications

  const unread = notifications.filter((n) => !n.isRead).length

  const handleMarkAllRead = () => {
    if (unread === 0) {
      toast.info(t('notifications.toast.allRead'))
      return
    }
    markAllNotificationsRead()
    toast.success(t('notifications.toast.markedRead'))
  }

  const handleTap = (id: string, isRead: boolean) => {
    if (!isRead) {
      markNotificationRead(id)
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteNotification(id)
    toast.success(t('notifications.toast.deleted'))
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">{t('notifications.title')}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllRead}
          className="text-muted-foreground hover:text-foreground"
        >
          <Check className="h-4 w-4 mr-1.5" />
          {t('notifications.markAllRead')}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-4 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
            filter === 'all'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('notifications.tab.all')}
          {notifications.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {notifications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
            filter === 'unread'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('notifications.tab.unread')}
          {unread > 0 && (
            <span className="ml-1.5 text-xs opacity-70">{unread}</span>
          )}
        </button>
      </div>

      <Separator />

      {/* Notification List */}
      <ScrollArea className="flex-1">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-muted-foreground"
          >
            <div className="rounded-full bg-muted p-4 mb-4">
              <BellOff className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium">{t('notifications.empty.title')}</p>
            <p className="text-sm mt-1">{t('notifications.empty.desc')}</p>
          </motion.div>
        ) : (
          <div className="px-4 py-3 space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => {
                const { icon: Icon, color, label } = getNotificationIcon(
                  notification.type,
                  t
                )
                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Card
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.isRead ? 'border-l-2 border-l-blue-500' : ''
                      }`}
                      onClick={() =>
                        handleTap(notification.id, notification.isRead)
                      }
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        {/* Type Icon */}
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full ${color}/10`}
                          >
                            <Icon
                              className={`h-5 w-5 ${color.replace('bg-', 'text-')}`}
                            />
                          </div>
                          {!notification.isRead && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-background" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3
                              className={`text-sm font-semibold truncate ${
                                !notification.isRead
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
                            >
                              {label}
                            </Badge>
                          </div>
                          <p
                            className={`text-sm leading-relaxed line-clamp-2 ${
                              notification.isRead
                                ? 'text-muted-foreground'
                                : 'text-foreground/80'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {getRelativeTime(notification.createdAt, t)}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(e, notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}