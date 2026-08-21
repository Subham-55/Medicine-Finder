'use client'

import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Search,
  Bell,
  User,
  Settings,
  MapPin,
  LogOut,
  X,
  Pill,
  Sparkles,
  ScanLine,
  Clock,
  ShieldAlert,
  Stethoscope,
  Bot,
  Heart,
  UserRound,
  MessageCircle,
  LayoutGrid,
  Map,
  Users,
  BookOpen,
  Calculator,
  Star,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const mainMenu = [
  { id: 'dashboard' as const, tkey: 'nav.dashboard', icon: Home },
  { id: 'search' as const, tkey: 'nav.search', icon: Search },
  { id: 'notifications' as const, tkey: 'nav.notifications', icon: Bell, badge: true },
  { id: 'profile' as const, tkey: 'nav.profile', icon: User },
  { id: 'settings' as const, tkey: 'nav.settings', icon: Settings },
]

const secondaryMenu = [
  { id: 'medicine-substitutes' as const, tkey: 'nav.aiSubstitutes', icon: Sparkles },
  { id: 'prescription-scanner' as const, tkey: 'nav.prescriptionScanner', icon: ScanLine },
  { id: 'saved-locations' as const, tkey: 'nav.savedLocations', icon: MapPin },
  { id: 'medicine-reminders' as const, tkey: 'nav.reminders', icon: Clock },
  { id: 'drug-interaction' as const, tkey: 'nav.drugInteraction', icon: ShieldAlert },
  { id: 'symptom-checker' as const, tkey: 'nav.symptomChecker', icon: Stethoscope },
  { id: 'ai-assistant' as const, tkey: 'nav.aiAssistant', icon: Bot },
  { id: 'health-tips' as const, tkey: 'nav.healthTips', icon: Heart },
  { id: 'find-doctor' as const, tkey: 'nav.findDoctor', icon: UserRound },
  { id: 'community-forum' as const, tkey: 'nav.forum', icon: MessageCircle },
  { id: 'category-browse' as const, tkey: 'nav.categories', icon: LayoutGrid },
  { id: 'map-view' as const, tkey: 'nav.mapView', icon: Map },
  { id: 'wishlist' as const, tkey: 'nav.wishlist', icon: Heart },
  { id: 'family-profiles' as const, tkey: 'nav.familyProfiles', icon: Users },
  { id: 'medicine-encyclopedia' as const, tkey: 'nav.encyclopedia', icon: BookOpen },
  { id: 'dosage-calculator' as const, tkey: 'nav.dosageCalc', icon: Calculator },
  { id: 'pharmacy-reviews' as const, tkey: 'nav.reviews', icon: Star },
  { id: 'refill-tracker' as const, tkey: 'nav.refillTracker', icon: RefreshCw },
]

export default function Sidebar() {
  const { currentScreen, navigate, sidebarOpen, setSidebarOpen, logout, unreadCount, user } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)
  const notifCount = unreadCount()

  const handleNav = (screen: string) => {
    navigate(screen as any)
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    setSidebarOpen(false)
    logout()
  }

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-50 h-full w-72 bg-background border-r border-border shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
                  <Pill className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">{t('common.appName')}</h2>
                  <p className="text-xs text-muted-foreground">
                    {user?.name || t('nav.guest')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Menu */}
            <div className="flex-1 py-2" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                  {t('nav.menu')}
                </p>
                {mainMenu.map((item) => {
                  const isActive = currentScreen === item.id ||
                    (item.id === 'search' && (currentScreen === 'search' || currentScreen === 'search-results'))

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={cn(
                        'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <div className="relative">
                        <item.icon className="w-5 h-5" />
                        {item.badge && notifCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-primary-foreground bg-destructive rounded-full">
                            {notifCount > 99 ? '99+' : notifCount}
                          </span>
                        )}
                      </div>
                      {t(item.tkey)}
                    </button>
                  )
                })}
              </div>

              <Separator className="my-2" />

              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                  {t('nav.more')}
                </p>
                {secondaryMenu.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    {t(item.tkey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                {t('common.logout')}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}