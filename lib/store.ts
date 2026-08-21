import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LANGUAGES } from './i18n'

export type AppScreen =
  | 'login'
  | 'dashboard'
  | 'search'
  | 'search-results'
  | 'pharmacy-detail'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'location-select'
  | 'saved-locations'
  | 'medicine-substitutes'
  | 'prescription-scanner'
  | 'medicine-reminders'
  | 'drug-interaction'
  | 'medicine-encyclopedia'
  | 'refill-tracker'
  | 'health-tips'
  | 'dosage-calculator'
  | 'pharmacy-reviews'
  | 'community-forum'
  | 'find-doctor'
  | 'symptom-checker'
  | 'ai-assistant'
  | 'wishlist'
  | 'family-profiles'
  | 'category-browse'
  | 'map-view'
  | 'admin-panel'
  | 'admin-store-create'
  | 'store-dashboard'
  | 'store-medicines'
  | 'store-medicine-add'
  | 'store-profile-edit'
  | 'store-analytics'
  | 'store-promotions'
  | 'store-insights'
  | 'admin-store-detail'
  | 'admin-store-edit'

export type SortOption = 'lowest-price' | 'nearest' | 'highest-rating'
export type FilterOption = {
  availableNow: boolean
  openStores: boolean
  maxDistance: number | null
  maxPrice: number | null
}

export interface User {
  id: string
  name: string
  mobile: string
  email?: string
  role: 'admin' | 'store_owner' | 'customer'
  avatar?: string
  preferredCity?: string
  theme: string
  colorTheme?: string
  notificationsEnabled: boolean
  locationLat?: number
  locationLng?: number
}

export interface SavedLocation {
  id: string
  label: string
  address: string
  city: string
  state: string
  country: string
  lat?: number
  lng?: number
  isDefault: boolean
}

export interface RecentSearch {
  id: string
  query: string
  createdAt: string
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface Pharmacy {
  id: string
  name: string
  address: string
  phone: string
  rating: number
  reviewCount: number
  distance: number
  travelTime: string
  isOpen: boolean
  workingHours: string
  lat: number
  lng: number
  medicines: PharmacyMedicine[]
  image?: string
}

export interface PharmacyMedicine {
  id: string
  name: string
  genericName: string
  price: number
  originalPrice: number
  inStock: boolean
  discount: number
  manufacturer: string
}

export interface SearchSuggestion {
  id: string
  name: string
  genericName: string
  category: string
}

export interface LocationData {
  country: string
  state: string
  city: string
  lat?: number
  lng?: number
}

export interface StoreData {
  id: string
  ownerId: string
  name: string
  address: string
  city: string
  state: string
  country: string
  phone: string
  lat?: number
  lng?: number
  licenseNumber?: string
  isOpen: boolean
  workingHours: string
  isActive: boolean
  medicineCount?: number
  createdAt: string
  updatedAt: string
}

export interface StoreMedicine {
  id: string
  storeId: string
  name: string
  genericName: string
  manufacturer: string
  category: string
  price: number
  originalPrice: number
  discount: number
  stockQuantity: number
  inStock: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export interface StoreAccount {
  id: string
  name: string
  email: string
  mobile?: string
  role: string
  isActive: boolean
  createdAt: string
  store: {
    id: string
    name: string
    address: string
    city: string
    state: string
    country: string
    phone: string
    isOpen: boolean
    workingHours: string
    isActive: boolean
    medicineCount?: number
  } | null
}

interface AppState {
  // Auth
  isAuthenticated: boolean
  user: User | null
  setAuth: (user: User) => void
  updateUser: (data: Partial<User>) => void
  logout: () => void

  // Language
  language: string
  setLanguage: (lang: string) => void

  // Navigation
  currentScreen: AppScreen
  previousScreen: AppScreen | null
  navigate: (screen: AppScreen) => void
  goBack: () => void

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchResults: Pharmacy[]
  setSearchResults: (results: Pharmacy[]) => void
  sortOption: SortOption
  setSortOption: (option: SortOption) => void
  filterOption: FilterOption
  setFilterOption: (filter: Partial<FilterOption>) => void
  isSearching: boolean
  setIsSearching: (v: boolean) => void

  // Location
  currentLocation: LocationData | null
  setCurrentLocation: (loc: LocationData) => void
  savedLocations: SavedLocation[]
  setSavedLocations: (locs: SavedLocation[]) => void
  addSavedLocation: (loc: SavedLocation) => void
  removeSavedLocation: (id: string) => void

  // Recent Searches
  recentSearches: RecentSearch[]
  setRecentSearches: (searches: RecentSearch[]) => void
  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void

  // Notifications
  notifications: AppNotification[]
  setNotifications: (notifs: AppNotification[]) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  deleteNotification: (id: string) => void
  unreadCount: () => number

  // Selected Pharmacy
  selectedPharmacy: Pharmacy | null
  setSelectedPharmacy: (pharmacy: Pharmacy | null) => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Admin
  adminStores: StoreAccount[]
  setAdminStores: (stores: StoreAccount[]) => void
  adminSelectedStoreId: string | null
  setAdminSelectedStoreId: (id: string | null) => void

  // Store Owner
  storeData: StoreData | null
  setStoreData: (store: StoreData | null) => void
  storeMedicines: StoreMedicine[]
  setStoreMedicines: (medicines: StoreMedicine[]) => void

  // Location Select Step
  locationSelectStep: 'country' | 'state' | 'city'
  setLocationSelectStep: (step: 'country' | 'state' | 'city') => void
  locationSelectData: { country: string; state: string }
  setLocationSelectData: (data: { country: string; state: string }) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      isAuthenticated: false,
      user: null,
      setAuth: (user) => set({ isAuthenticated: true, user: { ...user, role: user.role || 'customer', colorTheme: user.colorTheme || 'default' } }),
      updateUser: (data) => {
        const current = get().user
        if (current) set({ user: { ...current, ...data } })
      },
      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          currentScreen: 'login',
          searchQuery: '',
          searchResults: [],
          recentSearches: [],
          notifications: [],
          adminStores: [],
          adminSelectedStoreId: null,
          storeData: null,
          storeMedicines: [],
        }),

      // Language
      language: 'en',
      setLanguage: (lang) => {
        set({ language: lang })
        // Update html dir attribute for RTL support
        if (typeof document !== 'undefined') {
          const langDef = LANGUAGES.find((l) => l.code === lang)
          document.documentElement.lang = lang
          document.documentElement.dir = langDef?.dir || 'ltr'
        }
      },

      // Navigation
      currentScreen: 'login',
      previousScreen: null,
      navigate: (screen) =>
        set((state) => ({
          previousScreen: state.currentScreen,
          currentScreen: screen,
          sidebarOpen: false,
        })),
      goBack: () => {
        const { previousScreen } = get()
        if (previousScreen) {
          set((state) => ({
            currentScreen: state.previousScreen || 'dashboard',
            previousScreen: null,
          }))
        } else {
          set({ currentScreen: 'dashboard', previousScreen: null })
        }
      },

      // Search
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      searchResults: [],
      setSearchResults: (results) => set({ searchResults: results }),
      sortOption: 'lowest-price',
      setSortOption: (option) => set({ sortOption: option }),
      filterOption: { availableNow: false, openStores: false, maxDistance: null, maxPrice: null },
      setFilterOption: (filter) =>
        set((state) => ({ filterOption: { ...state.filterOption, ...filter } })),
      isSearching: false,
      setIsSearching: (v) => set({ isSearching: v }),

      // Location
      currentLocation: null,
      setCurrentLocation: (loc) => set({ currentLocation: loc }),
      savedLocations: [],
      setSavedLocations: (locs) => set({ savedLocations: locs }),
      addSavedLocation: (loc) =>
        set((state) => ({ savedLocations: [...state.savedLocations, loc] })),
      removeSavedLocation: (id) =>
        set((state) => ({
          savedLocations: state.savedLocations.filter((l) => l.id !== id),
        })),

      // Recent Searches
      recentSearches: [],
      setRecentSearches: (searches) => set({ recentSearches: searches }),
      addRecentSearch: (query) => {
        const trimmed = query.trim()
        if (!trimmed) return
        set((state) => {
          const filtered = state.recentSearches.filter((s) => s.query.toLowerCase() !== trimmed.toLowerCase())
          const newSearch: RecentSearch = {
            id: `recent-${Date.now()}`,
            query: trimmed,
            createdAt: new Date().toISOString(),
          }
          return { recentSearches: [newSearch, ...filtered].slice(0, 10) }
        })
      },
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Notifications
      notifications: [],
      setNotifications: (notifs) => set({ notifications: notifs }),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),
      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      unreadCount: () => get().notifications.filter((n) => !n.isRead).length,

      // Selected Pharmacy
      selectedPharmacy: null,
      setSelectedPharmacy: (pharmacy) => set({ selectedPharmacy: pharmacy }),

      // Sidebar
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Admin
      adminStores: [],
      setAdminStores: (stores) => set({ adminStores: stores }),
      adminSelectedStoreId: null,
      setAdminSelectedStoreId: (id) => set({ adminSelectedStoreId: id }),

      // Store Owner
      storeData: null,
      setStoreData: (store) => set({ storeData: store }),
      storeMedicines: [],
      setStoreMedicines: (medicines) => set({ storeMedicines: medicines }),

      // Location Select Step
      locationSelectStep: 'country',
      setLocationSelectStep: (step) => set({ locationSelectStep: step }),
      locationSelectData: { country: '', state: '' },
      setLocationSelectData: (data) =>
        set((state) => ({ locationSelectData: { ...state.locationSelectData, ...data } })),
    }),
    {
      name: 'medicine-finder-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        currentLocation: state.currentLocation,
        savedLocations: state.savedLocations,
        recentSearches: state.recentSearches,
        notifications: state.notifications,
        searchQuery: state.searchQuery,
        theme: state.user?.theme,
        colorTheme: state.user?.colorTheme,
        language: state.language,
      }),
    }
  )
)