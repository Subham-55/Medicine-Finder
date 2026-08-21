'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Phone,
  MapPin,
  Star,
  Clock,
  Navigation,
  ExternalLink,
  TrendingDown,
  AlertCircle,
  Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'

const slideVariants = {
  initial: { x: 60, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 60, opacity: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants = {
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
}

export default function PharmacyDetailScreen() {
  const { selectedPharmacy, goBack, searchResults, navigate, setSearchQuery } = useAppStore()

  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)

  const sortedMedicines = useMemo(() => {
    if (!selectedPharmacy) return []
    return [...selectedPharmacy.medicines].sort((a, b) => a.price - b.price)
  }, [selectedPharmacy])

  // Build a map of medicine name -> lowest price across all search results
  const lowestPriceMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const pharmacy of searchResults) {
      for (const med of pharmacy.medicines) {
        const key = med.name.toLowerCase()
        if (!(key in map) || med.price < map[key]) {
          map[key] = med.price
        }
      }
    }
    return map
  }, [searchResults])

  const getMapsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

  const getDirectionsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  if (!selectedPharmacy) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {t('pharmacy.notFound')}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {t('pharmacy.notFoundDesc')}
        </p>
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('pharmacy.goBack')}
        </Button>
      </motion.div>
    )
  }

  const { name, address, phone, rating, reviewCount, distance, travelTime, isOpen, workingHours, lat, lng } = selectedPharmacy

  return (
    <motion.div
      className="w-full max-w-lg mx-auto"
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <ScrollArea className="h-[calc(100dvh-4rem)]">
        <div className="px-4 pb-8 space-y-4">
          {/* ─── Header Bar ─── */}
          <motion.div
            className="flex items-center justify-between py-3 sticky top-0 bg-white/95 backdrop-blur-sm z-10 -mx-4 px-4"
            variants={itemVariants}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="h-9 w-9 -ml-2"
              aria-label={t('pharmacy.goBack')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
              {name}
            </h1>
            <a href={`tel:${phone}`}>
              <Button variant="ghost" size="icon" className="h-9 w-9 -mr-2" aria-label={t('pharmacy.callPharmacy')}>
                <Phone className="h-5 w-5" />
              </Button>
            </a>
          </motion.div>

          {/* ─── Store Info Card ─── */}
          <motion.div variants={itemVariants}>
            <Card className="border-gray-200 shadow-none">
              <CardContent className="p-4 space-y-3">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{name}</h2>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-600 leading-snug">{address}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-gray-900 text-gray-900" />
                  <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({reviewCount} {t('common.reviews')})</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-600">{workingHours}</span>
                  <Badge
                    variant="secondary"
                    className={
                      isOpen
                        ? 'bg-green-100 text-green-700 hover:bg-green-100 ml-auto'
                        : 'bg-red-100 text-red-700 hover:bg-red-100 ml-auto'
                    }
                  >
                    {isOpen ? t('common.open') : t('common.closed')}
                  </Badge>
                </div>

                <Separator className="bg-gray-100" />

                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-600">
                    {distance} {t('common.km')} ({travelTime})
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Map Section ─── */}
          <motion.div variants={itemVariants}>
            <Card className="border-gray-200 shadow-none overflow-hidden">
              <div className="relative w-full h-40 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">{t('pharmacy.mapPreview')}</p>
                </div>
              </div>
              <CardContent className="p-3">
                <a
                  href={getMapsUrl(lat, lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('pharmacy.openInMaps')}
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Action Buttons Row ─── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            <a
              href={getDirectionsUrl(lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                <Navigation className="h-4 w-4 mr-2" />
                {t('pharmacy.getDirections')}
              </Button>
            </a>
            <a href={`tel:${phone}`} className="block">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                <Phone className="h-4 w-4 mr-2" />
                {t('pharmacy.callStore')}
              </Button>
            </a>
          </motion.div>

          {/* ─── Available Medicines ─── */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                {t('pharmacy.availableMedicines')} ({sortedMedicines.length})
              </h3>
            </div>

            {sortedMedicines.length === 0 ? (
              <Card className="border-gray-200 shadow-none">
                <CardContent className="p-6 text-center space-y-3">
                  <Search className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600 font-medium">
                    {t('pharmacy.searchMedicines')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('pharmacy.findPrices')} {name}
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery('')
                      navigate('search')
                    }}
                    className="mt-2"
                    size="sm"
                  >
                    <Search className="h-4 w-4 mr-1.5" />
                    {t('pharmacy.searchMedicinesBtn')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <AnimatePresence mode="popLayout">
                  {sortedMedicines.map((med) => {
                    const lowestPrice = lowestPriceMap[med.name.toLowerCase()]
                    const isLowest = lowestPrice !== undefined && med.price === lowestPrice
                    const otherStoresCount = searchResults.filter((p) =>
                      p.medicines.some((m) => m.name.toLowerCase() === med.name.toLowerCase() && p.id !== selectedPharmacy.id)
                    ).length
                    const hasComparison = otherStoresCount > 0

                    return (
                      <motion.div key={med.id} variants={itemVariants} layout>
                        <Card className="border-gray-200 shadow-none hover:border-gray-400 transition-colors duration-200">
                          <CardContent className="p-4 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-900 leading-tight">
                                    {med.name}
                                  </span>
                                  {isLowest && hasComparison && (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 py-0 h-5 border-0 shrink-0">
                                      <TrendingDown className="h-3 w-3 mr-0.5" />
                                      {t('pharmacy.lowestPriceNearYou')}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{med.genericName}</p>
                              </div>
                              <Badge
                                variant="secondary"
                                className={
                                  med.inStock
                                    ? 'bg-green-100 text-green-700 hover:bg-green-100 text-[10px] shrink-0'
                                    : 'bg-red-100 text-red-700 hover:bg-red-100 text-[10px] shrink-0'
                                }
                              >
                                {med.inStock ? t('common.inStock') : t('common.outOfStock')}
                              </Badge>
                            </div>

                            <p className="text-xs text-gray-500">{med.manufacturer}</p>

                            <Separator className="bg-gray-100" />

                            <div className="flex items-end justify-between">
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-gray-900">
                                  ₹{med.price}
                                </span>
                                {med.originalPrice > med.price && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ₹{med.originalPrice}
                                  </span>
                                )}
                                {med.discount > 0 && (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 py-0 h-5 border-0">
                                    {med.discount}{t('common.off')}
                                  </Badge>
                                )}
                              </div>
                              {hasComparison && !isLowest && (
                                <span className="text-[11px] text-gray-500">
                                  {t('pharmacy.availableAt', { price: lowestPrice })}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </div>
      </ScrollArea>
    </motion.div>
  )
}