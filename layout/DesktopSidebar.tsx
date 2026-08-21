'use client'

import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion } from 'framer-motion'
import {
  Home,
  Search,
  Bell,
  User,
  Settings,
  MapPin,
  Menu,
  Pill,
  Moon,
  Sun,
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
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { id: 'dashboard' as const, tkey: 'nav.dashboard', icon: Home },
  { id: 'search' as const, tkey: 'nav.search', icon: Search },
  { id: 'notifications' as const, tkey: 'nav.notifications', icon: Bell },
  { id: 'profile' as const, tkey: 'nav.profile', icon: User },
  { id: 'settings' as const, tkey: 'nav.settings', icon: Settings },
]

export default function DesktopSidebar() {
  const { currentScreen, navigate, unreadCount, user, setSidebarOpen } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)
  const { theme, setTheme } = useTheme()
  const notifCount = unreadCount()

  const handleNav = (screen: any) => {
    navigate(screen)
  }

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-background border-r border-border fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-base tracking-tight">{t('common.appName')}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id ||
            (item.id === 'search' && (currentScreen === 'search' || currentScreen === 'search-results'))

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <div className="relative">
                <item.icon className="w-[18px] h-[18px]" />
                {item.id === 'notifications' && notifCount > 0 && (
                  <span className={cn(
                    'absolute -top-1.5 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full',
                    isActive
                      ? 'bg-white text-primary'
                      : 'bg-destructive text-primary-foreground'
                  )}>
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </div>
              {t(item.tkey)}
            </button>
          )
        })}

        <div className="pt-2 mt-2 border-t border-border">
          <button
            onClick={() => navigate('saved-locations')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              currentScreen === 'saved-locations'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <MapPin className="w-[18px] h-[18px]" />
            {t('nav.savedLocations')}
          </button>
          <button
            onClick={() => navigate('medicine-substitutes')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1',
              currentScreen === 'medicine-substitutes'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Sparkles className="w-[18px] h-[18px]" />
            {t('nav.aiSubstitutes')}
          </button>
          <button
            onClick={() => navigate('prescription-scanner')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1',
              currentScreen === 'prescription-scanner'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <ScanLine className="w-[18px] h-[18px]" />
            {t('nav.prescriptionScanner')}
          </button>
        </div>

        {/* More Features */}
        <div className="pt-2 mt-2 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            {t('nav.more')}
          </p>
          <div className="max-h-[300px] overflow-y-auto space-y-0.5">
            {[
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
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentScreen === item.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {t(item.tkey)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{t('nav.theme')}</span>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                theme === 'light' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                theme === 'dark' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('profile')}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-foreground">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || t('nav.guest')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.mobile
                ? user.mobile.replace(/(\d{2})(\d{4})(\d{4})/, '+$1 **** $3')
                : t('nav.notLoggedIn')}
            </p>
          </div>
        </button>
      </div>
    </aside>
  )
}