'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Phone,
  Clock,
  ChevronDown,
  SearchX,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { useAppStore, type SortOption, type Pharmacy } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'

interface PriceComparison {
  minPrice: number
  maxPrice: number
  avgPrice: number
  bestDeal: {
    id: string
    name: string
    medicines: { price: number }[]
  }
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.3
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${
            i < fullStars
              ? 'fill-amber-400 text-amber-400'
              : i === fullStars && hasHalf
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

function ResultCardSkeleton() {
  return (
    <Card className="py-4">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-56" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Separator />
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3.5 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Separator />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-5 w-20 rounded-full ml-auto" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function SearchResultsScreen() {
  const {
    searchQuery,
    searchResults,
    currentLocation,
    setSearchResults,
    sortOption,
    setSortOption,
    filterOption,
    setFilterOption,
    isSearching,
    setIsSearching,
    navigate,
    goBack,
    setSelectedPharmacy,
  } = useAppStore()

  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)

  const [priceComparison, setPriceComparison] = useState<PriceComparison | null>(null)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [localFilter, setLocalFilter] = useState(filterOption)
  const [editQuery, setEditQuery] = useState(searchQuery)
  const [isEditing, setIsEditing] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Compute the global lowest price across all medicines in all results
  const globalLowestPrice = useMemo(() => {
    let min = Infinity
    for (const pharmacy of searchResults) {
      for (const med of pharmacy.medicines) {
        if (med.inStock && med.price < min) {
          min = med.price
        }
      }
    }
    return min === Infinity ? null : min
  }, [searchResults])

  const fetchResults = useCallback(async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const params = new URLSearchParams()
      params.set('q', searchQuery)
      params.set('sort', sortOption)
      if (currentLocation) {
        params.set('country', currentLocation.country)
        params.set('state', currentLocation.state)
        params.set('city', currentLocation.city)
      }
      if (filterOption.availableNow) params.set('available', 'true')
      if (filterOption.openStores) params.set('open', 'true')
      if (filterOption.maxDistance) params.set('maxDistance', String(filterOption.maxDistance))
      if (filterOption.maxPrice) params.set('maxPrice', String(filterOption.maxPrice))

      const res = await fetch(`/api/search?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
        if (data.priceComparison) {
          setPriceComparison(data.priceComparison)
        } else {
          setPriceComparison(null)
        }
      }
    } catch {
      setSearchResults([])
      setPriceComparison(null)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, sortOption, filterOption, setSearchResults, setIsSearching])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  useEffect(() => {
    setEditQuery(searchQuery)
  }, [searchQuery])

  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filterOption.availableNow) count++
    if (filterOption.openStores) count++
    if (filterOption.maxDistance !== null) count++
    if (filterOption.maxPrice !== null) count++
    return count
  }

  const handleOpenFilterSheet = () => {
    setLocalFilter({ ...filterOption })
    setFilterSheetOpen(true)
  }

  const handleApplyFilters = () => {
    setFilterOption(localFilter)
    setFilterSheetOpen(false)
  }

  const handleCardClick = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy)
    navigate('pharmacy-detail')
  }

  const handleEditSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (editQuery.trim()) {
      useAppStore.getState().setSearchQuery(editQuery.trim())
      useAppStore.getState().addRecentSearch(editQuery.trim())
      setIsEditing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3 space-y-3">
          {/* Top row: back + search bar */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="shrink-0"
            >
              <ArrowLeft className="size-5" />
            </Button>

            {isEditing ? (
              <form onSubmit={handleEditSearch} className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    ref={editInputRef}
                    value={editQuery}
                    onChange={(e) => setEditQuery(e.target.value)}
                    onBlur={() => {
                      if (!editQuery.trim()) setIsEditing(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditQuery(searchQuery)
                        setIsEditing(false)
                      }
                    }}
                    className="h-10 pl-10 pr-3 text-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-border rounded-xl"
                    autoFocus
                  />
                </div>
                <Button type="submit" size="sm" className="rounded-lg">
                  {t('common.search')}
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center gap-2 h-10 px-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <Search className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{searchQuery}</span>
              </button>
            )}
          </div>

          {/* Sort & Filter bar */}
          <div className="flex items-center gap-2">
            <Select value={sortOption} onValueChange={handleSortChange}>
              <SelectTrigger size="sm" className="rounded-lg text-xs h-8">
                <SelectValue placeholder={t('results.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lowest-price">{t('results.sort.lowestPrice')}</SelectItem>
                <SelectItem value="nearest">{t('results.sort.nearest')}</SelectItem>
                <SelectItem value="highest-rating">{t('results.sort.highestRating')}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs gap-1.5"
              onClick={handleOpenFilterSheet}
            >
              <SlidersHorizontal className="size-3.5" />
              {t('results.filters')}
              {getActiveFilterCount() > 0 && (
                <Badge
                  variant="default"
                  className="ml-0.5 h-4 min-w-4 px-1 text-[10px] rounded-full"
                >
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>

            {!isSearching && searchResults.length > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {searchResults.length} {searchResults.length === 1 ? t('results.result') : t('results.results')}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4 pb-8">
          {/* Price Comparison Banner */}
          <AnimatePresence>
            {priceComparison && !isSearching && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="py-4 border-dashed">
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="size-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{t('results.priceComparison')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">{t('results.minPrice')}</p>
                        <p className="text-lg font-bold">&#8377;{priceComparison.minPrice}</p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="flex-1 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">{t('results.avgPrice')}</p>
                        <p className="text-lg font-bold text-muted-foreground">
                          &#8377;{priceComparison.avgPrice}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="flex-1 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">{t('results.maxPrice')}</p>
                        <p className="text-lg font-bold text-muted-foreground">
                          &#8377;{priceComparison.maxPrice}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-center gap-2">
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                          {t('common.bestPrice')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          &#8377;{priceComparison.bestDeal.medicines[0]?.price ?? priceComparison.minPrice} at{' '}
                          <span className="font-medium text-foreground">
                            {priceComparison.bestDeal.name}
                          </span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Skeletons */}
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                >
                  <ResultCardSkeleton />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State */}
          {!isSearching && searchResults.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <SearchX className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{t('results.noResults')}</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t('results.noResultsDesc', { query: searchQuery })}
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-lg"
                onClick={() => navigate('search')}
              >
                <Search className="size-4" />
                {t('results.searchAgain')}
              </Button>
            </motion.div>
          )}

          {/* Result Cards */}
          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((pharmacy, index) => (
                <motion.div
                  key={pharmacy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.06,
                    duration: 0.35,
                    ease: 'easeOut',
                  }}
                >
                  <Card
                    className="py-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] transition-transform duration-150"
                    onClick={() => handleCardClick(pharmacy)}
                  >
                    <CardContent className="space-y-3">
                      {/* Pharmacy Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-tight">
                            {pharmacy.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {pharmacy.address}
                          </p>
                        </div>
                        <Badge
                          variant={pharmacy.isOpen ? 'default' : 'destructive'}
                          className="shrink-0 text-[10px] px-2 py-0.5 rounded-full"
                        >
                          {pharmacy.isOpen ? t('common.open') : t('common.closed')}
                        </Badge>
                      </div>

                      {/* Rating & Reviews */}
                      <div className="flex items-center gap-2">
                        <StarRating rating={pharmacy.rating} />
                        <span className="text-xs font-medium">{pharmacy.rating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({pharmacy.reviewCount} {t('common.reviews')})
                        </span>
                      </div>

                      <Separator />

                      {/* Medicines */}
                      <div className="space-y-3">
                        {pharmacy.medicines.map((med) => {
                          const isBestPrice =
                            globalLowestPrice !== null && med.price === globalLowestPrice && med.inStock
                          return (
                            <div
                              key={med.id}
                              className="space-y-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">
                                      {med.name}
                                    </p>
                                    {isBestPrice && (
                                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] px-1.5 py-0 rounded-full shrink-0">
                                        {t('common.bestPrice')}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {med.manufacturer}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-bold">
                                    &#8377;{med.price}
                                  </p>
                                  {med.discount > 0 && (
                                    <div className="flex items-center gap-1.5 justify-end">
                                      <span className="text-xs text-muted-foreground line-through">
                                        &#8377;{med.originalPrice}
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="text-emerald-700 bg-emerald-50 border-0 text-[10px] px-1.5 py-0 rounded-full"
                                      >
                                        {med.discount}{t('common.off')}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge
                                variant={med.inStock ? 'secondary' : 'destructive'}
                                className="text-[10px] px-1.5 py-0 rounded-full"
                              >
                                {med.inStock ? t('common.inStock') : t('common.outOfStock')}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>

                      <Separator />

                      {/* Distance, Time, Actions */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            <span>{pharmacy.distance} {t('common.km')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            <span>{pharmacy.travelTime}</span>
                          </div>
                          <span className="text-muted-foreground/60">
                            {pharmacy.workingHours}
                          </span>
                        </div>

                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 rounded-lg text-xs gap-1.5"
                            onClick={() => handleCardClick(pharmacy)}
                          >
                            <MapPin className="size-3.5" />
                            {t('results.viewOnMap')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 rounded-lg text-xs gap-1.5"
                            asChild
                          >
                            <a href={`tel:${pharmacy.phone}`}>
                              <Phone className="size-3.5" />
                              {t('results.callStore')}
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
          <SheetHeader className="pb-2">
            <SheetTitle>{t('results.filter.title')}</SheetTitle>
            <SheetDescription>
              {t('results.filter.description')}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="space-y-6 py-4">
              {/* Emergency: Open 24/7 */}
              <Button
                variant="destructive"
                className="w-full h-12 rounded-xl gap-2 text-sm font-semibold"
                onClick={() => {
                  setFilterOption({
                    availableNow: true,
                    openStores: true,
                    maxDistance: 5,
                    maxPrice: null,
                  })
                  setFilterSheetOpen(false)
                }}
              >
                <AlertTriangle className="size-4.5" />
                Emergency: Open 24/7 Near You
              </Button>

              <Separator />

              {/* Available Now Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="available-toggle" className="text-sm font-medium">
                    {t('results.filter.availableNow')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('results.filter.availableNowDesc')}
                  </p>
                </div>
                <Switch
                  id="available-toggle"
                  checked={localFilter.availableNow}
                  onCheckedChange={(checked) =>
                    setLocalFilter((prev) => ({ ...prev, availableNow: checked }))
                  }
                />
              </div>

              <Separator />

              {/* Open Stores Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="open-toggle" className="text-sm font-medium">
                    {t('results.filter.openStores')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('results.filter.openStoresDesc')}
                  </p>
                </div>
                <Switch
                  id="open-toggle"
                  checked={localFilter.openStores}
                  onCheckedChange={(checked) =>
                    setLocalFilter((prev) => ({ ...prev, openStores: checked }))
                  }
                />
              </div>

              <Separator />

              {/* Max Distance Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('results.filter.maxDistance')}</Label>
                  <span className="text-sm text-muted-foreground">
                    {localFilter.maxDistance
                      ? `${localFilter.maxDistance} ${t('common.km')}`
                      : t('common.any')}
                  </span>
                </div>
                <Slider
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={localFilter.maxDistance ? [localFilter.maxDistance] : [10]}
                  onValueChange={([val]) =>
                    setLocalFilter((prev) => ({
                      ...prev,
                      maxDistance: val >= 10 ? null : val,
                    }))
                  }
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0.5 km</span>
                  <span>10 km</span>
                </div>
              </div>

              <Separator />

              {/* Max Price Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('results.filter.maxPrice')}</Label>
                  <span className="text-sm text-muted-foreground">
                    {localFilter.maxPrice
                      ? `₹${localFilter.maxPrice}`
                      : t('common.any')}
                  </span>
                </div>
                <Slider
                  min={10}
                  max={500}
                  step={10}
                  value={localFilter.maxPrice ? [localFilter.maxPrice] : [500]}
                  onValueChange={([val]) =>
                    setLocalFilter((prev) => ({
                      ...prev,
                      maxPrice: val >= 500 ? null : val,
                    }))
                  }
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>₹10</span>
                  <span>₹500</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="pt-2 border-t -mx-4 px-4">
            <Button
              variant="outline"
              className="flex-1 rounded-lg"
              onClick={() => {
                setLocalFilter({
                  availableNow: false,
                  openStores: false,
                  maxDistance: null,
                  maxPrice: null,
                })
              }}
            >
              {t('common.reset')}
            </Button>
            <Button className="flex-1 rounded-lg" onClick={handleApplyFilters}>
              {t('common.apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}
