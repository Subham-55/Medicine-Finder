'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Bell,
  Settings,
  HelpCircle,
  Shield,
  Info,
  LogOut,
  Search,
  Pencil,
  Check,
  X,
} from 'lucide-react'

export default function ProfileScreen() {
  const {
    user,
    updateUser,
    recentSearches,
    unreadCount,
    savedLocations,
    navigate,
    logout,
  } = useAppStore()

  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(user?.name ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSaveName = () => {
    const trimmed = editName.trim()
    if (trimmed) {
      updateUser({ name: trimmed })
      toast.success(t('profile.nameUpdated'))
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditName(user?.name ?? '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName()
    if (e.key === 'Escape') handleCancelEdit()
  }

  const maskedMobile = user?.mobile
    ? user.mobile.slice(0, -4).replace(/./g, '*') + user.mobile.slice(-4)
    : '+91 ****5432'

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  const menuItems = [
    {
      icon: MapPin,
      label: t('profile.savedLocations'),
      action: () => navigate('saved-locations'),
      badge: savedLocations.length.toString(),
    },
    {
      icon: Bell,
      label: t('profile.notifications'),
      action: () => navigate('notifications'),
      badge: unreadCount() > 0 ? unreadCount().toString() : undefined,
    },
    {
      icon: Settings,
      label: t('profile.settings'),
      action: () => navigate('settings'),
    },
    {
      icon: HelpCircle,
      label: t('profile.helpSupport'),
      action: () => toast.info(t('profile.comingSoon')),
    },
    {
      icon: Shield,
      label: t('profile.privacyPolicy'),
      action: () => toast.info(t('profile.comingSoon')),
    },
    {
      icon: Info,
      label: t('profile.about'),
      action: () => toast.info(t('profile.appVersion')),
      detail: 'v1.0.0',
    },
  ]

  const handleLogout = () => {
    logout()
    toast.success(t('profile.loggedOut'))
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 overflow-y-auto"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col items-center px-4 pt-4 pb-6"
        >
          <Card className="w-full max-w-sm">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-foreground text-background text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {isEditing ? (
                <div className="flex items-center gap-2 w-full max-w-[200px]">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 text-center text-sm font-semibold border-b-2 border-foreground bg-transparent outline-none py-1"
                    maxLength={30}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleSaveName}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">
                    {user?.name || t('profile.user')}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <p className="text-sm text-muted-foreground font-mono">
                +91 {maskedMobile.replace('+91 ', '')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="px-4 pb-4"
        >
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-bold">
                  {savedLocations.length}
                </span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  {t('profile.stat.savedLocations')}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-bold">
                  {recentSearches.length}
                </span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  {t('profile.stat.searches')}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-bold">{unreadCount()}</span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  {t('profile.stat.notifications')}
                </span>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <Separator className="mx-4" />

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="px-4 py-4"
        >
          <Card>
            {menuItems.map((item, index) => (
              <div key={item.label}>
                <button
                  onClick={item.action}
                  className="flex items-center w-full gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted">
                    <item.icon className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="text-xs h-5 px-1.5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {item.detail && (
                    <span className="text-xs text-muted-foreground">
                      {item.detail}
                    </span>
                  )}
                </button>
                {index < menuItems.length - 1 && (
                  <Separator className="ml-16" />
                )}
              </div>
            ))}
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="px-4 pb-8"
        >
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('profile.logout')}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}