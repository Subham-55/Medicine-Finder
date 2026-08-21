'use client'

import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Plus,
  Trash2,
  Navigation,
  ChevronRight,
  Home as HomeIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { countries } from '@/lib/mock-data'
import { toast } from 'sonner'

export default function SavedLocationsScreen() {
  const {
    savedLocations,
    addSavedLocation,
    removeSavedLocation,
    currentLocation,
    setCurrentLocation,
    navigate,
    goBack,
  } = useAppStore()

  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const handleSetAsCurrent = (loc: typeof savedLocations[0]) => {
    setCurrentLocation({
      country: loc.country,
      state: loc.state,
      city: loc.city,
      lat: loc.lat,
      lng: loc.lng,
    })
    toast.success(t('savedLocations.updated'))
  }

  const handleDelete = (id: string) => {
    removeSavedLocation(id)
    toast.success(t('savedLocations.removed'))
  }

  const handleAddSample = () => {
    const randomState = countries[0].states[Math.floor(Math.random() * countries[0].states.length)]
    const randomCity = randomState.cities[Math.floor(Math.random() * randomState.cities.length)]
    const newLoc = {
      id: `loc-${Date.now()}`,
      label: randomCity,
      address: `${randomCity}, ${randomState.name}`,
      city: randomCity,
      state: randomState.name,
      country: 'India',
      isDefault: false,
    }
    addSavedLocation(newLoc)
    toast.success(t('savedLocations.added', { name: randomCity }))
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goBack}>
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Button>
          <h1 className="text-base font-semibold">{t('savedLocations.title')}</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Location */}
        {currentLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t('savedLocations.current')}
            </p>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{currentLocation.city}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentLocation.state}, {currentLocation.country}
                    </p>
                    <Badge variant="secondary" className="mt-2 text-[10px]">
                      {t('savedLocations.active')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Saved Locations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('savedLocations.saved')} ({savedLocations.length})
            </p>
          </div>

          {savedLocations.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence>
                {savedLocations.map((loc, index) => (
                  <motion.div
                    key={loc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:border-foreground/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary shrink-0">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{loc.label}</p>
                              {loc.isDefault && (
                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                  {t('savedLocations.default')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {loc.address || `${loc.city}, ${loc.state}, ${loc.country}`}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleSetAsCurrent(loc)}
                              >
                                {t('savedLocations.setCurrent')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:text-destructive"
                                onClick={() => handleDelete(loc.id)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                {t('common.remove')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <MapPin className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mt-3">{t('savedLocations.empty.title')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('savedLocations.empty.desc')}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Add Location */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            className="w-full h-12 border-dashed"
            onClick={() => navigate('location-select')}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('savedLocations.addNew')}
          </Button>
        </motion.div>

        {/* Quick Add Sample (for demo) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={handleAddSample}
          >
            {t('savedLocations.addSample')}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}