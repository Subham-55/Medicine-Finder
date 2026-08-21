'use client'

import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion } from 'framer-motion'
import {
  Home,
  Search,
  Bell,
  User,
  Grid3X3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'dashboard' as const, tkey: 'nav.home', icon: Home },
  { id: 'search' as const, tkey: 'nav.search', icon: Search },
  { id: 'notifications' as const, tkey: 'nav.alerts', icon: Bell },
  { id: 'profile' as const, tkey: 'nav.profile', icon: User },
  { id: '__more__' as const, tkey: 'nav.more', icon: Grid3X3 },
] as const

export default function BottomNav() {
  const { currentScreen, navigate, unreadCount, setSidebarOpen } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)
  const notifCount = unreadCount()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id ||
            (tab.id === 'search' && (currentScreen === 'search' || currentScreen === 'search-results'))

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === '__more__') {
                  setSidebarOpen(true)
                } else {
                  navigate(tab.id)
                }
              }}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    'flex items-center justify-center w-10 h-8 rounded-xl transition-colors',
                    isActive ? 'bg-primary/10' : ''
                  )}
                >
                  <tab.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                </motion.div>
                {tab.id === 'notifications' && notifCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-primary-foreground bg-destructive rounded-full"
                  >
                    {notifCount > 99 ? '99+' : notifCount}
                  </motion.span>
                )}
              </div>
              <span className={cn('text-[10px] leading-tight', isActive ? 'font-semibold' : 'font-medium')}>
                {t(tab.tkey)}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}