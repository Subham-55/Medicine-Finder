'use client'

import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Bell,
  Search,
  MapPin,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

interface TopBarProps {
  showBack?: boolean
}

export default function TopBar({ showBack = false }: TopBarProps) {
  const {
    navigate,
    goBack,
    setSidebarOpen,
    unreadCount,
    currentLocation,
    searchQuery,
    setSearchQuery,
    addRecentSearch,
    setIsSearching,
    setSearchResults,
    currentScreen,
  } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)
  const notifCount = unreadCount()
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (query: string) => {
    if (!query.trim()) return
    setSearchQuery(query)
    addRecentSearch(query)
    setIsSearching(true)
    navigate('search-results')
  }

  // Show search bar on dashboard, search, and search-results screens
  const showSearchBar = ['dashboard', 'search', 'search-results'].includes(currentScreen)

  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={goBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}

          {currentLocation && showSearchBar && (
            <button
              onClick={() => navigate('location-select')}
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate">{currentLocation.city}</span>
            </button>
          )}
        </div>

        {/* Center - Search Bar (mobile) */}
        {showSearchBar && (
          <div className="flex-1 max-w-md mx-3 md:mx-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(searchQuery)
                }}
                placeholder={t('search.placeholder')}
                className="h-9 pl-9 pr-3 text-sm bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            onClick={() => navigate('notifications')}
          >
            <Bell className="w-4 h-4" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 text-[9px] font-bold text-primary-foreground bg-destructive rounded-full">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}