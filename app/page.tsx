'use client'

import { useAppStore, type AppScreen } from '@/lib/store'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// lazy() helper: wraps dynamic import in try/catch so Turbopack SWC crashes
// in framer-motion modules don't take down the whole app.
function lazy(importFn: () => Promise<{ default: ComponentType }>) {
  return dynamic(
    () =>
      importFn().catch(() => ({
        default: () => <div className="p-8 text-center text-muted-foreground">Loading…</div>,
      })),
    { ssr: false },
  )
}

// Dynamic imports for code splitting
const LoginScreen = dynamic(() => import('@/components/screens/LoginScreen'), { ssr: false })
const DashboardScreen = dynamic(() => import('@/components/screens/DashboardScreen'), { ssr: false })
const SearchScreen = dynamic(() => import('@/components/screens/SearchScreen'), { ssr: false })
const SearchResultsScreen = dynamic(() => import('@/components/screens/SearchResultsScreen'), { ssr: false })
const PharmacyDetailScreen = dynamic(() => import('@/components/screens/PharmacyDetailScreen'), { ssr: false })
const NotificationsScreen = dynamic(() => import('@/components/screens/NotificationsScreen'), { ssr: false })
const ProfileScreen = dynamic(() => import('@/components/screens/ProfileScreen'), { ssr: false })
const SettingsScreen = dynamic(() => import('@/components/screens/SettingsScreen'), { ssr: false })
const LocationSelectScreen = dynamic(() => import('@/components/screens/LocationSelectScreen'), { ssr: false })
const SavedLocationsScreen = dynamic(() => import('@/components/screens/SavedLocationsScreen'), { ssr: false })
const PrescriptionScannerScreen = dynamic(() => import('@/components/screens/PrescriptionScannerScreen'), { ssr: false })
const MedicineSubstitutesScreen = dynamic(() => import('@/components/screens/MedicineSubstitutesScreen'), { ssr: false })

// New customer screens
const MedicineRemindersScreen = lazy(() => import('@/components/screens/MedicineRemindersScreen'))
const DrugInteractionScreen = lazy(() => import('@/components/screens/DrugInteractionScreen'))
const MedicineEncyclopediaScreen = lazy(() => import('@/components/screens/MedicineEncyclopediaScreen'))
const RefillTrackerScreen = lazy(() => import('@/components/screens/RefillTrackerScreen'))
const HealthTipsScreen = lazy(() => import('@/components/screens/HealthTipsScreen'))
const DosageCalculatorScreen = lazy(() => import('@/components/screens/DosageCalculatorScreen'))
const PharmacyReviewsScreen = lazy(() => import('@/components/screens/PharmacyReviewsScreen'))
const CommunityForumScreen = lazy(() => import('@/components/screens/CommunityForumScreen'))
const FindDoctorScreen = lazy(() => import('@/components/screens/FindDoctorScreen'))
const SymptomCheckerScreen = lazy(() => import('@/components/screens/SymptomCheckerScreen'))
const AIAssistantScreen = lazy(() => import('@/components/screens/AIAssistantScreen'))
const WishlistScreen = lazy(() => import('@/components/screens/WishlistScreen'))
const FamilyProfilesScreen = lazy(() => import('@/components/screens/FamilyProfilesScreen'))
const CategoryBrowseScreen = lazy(() => import('@/components/screens/CategoryBrowseScreen'))
const MapViewScreen = lazy(() => import('@/components/screens/MapViewScreen'))

// Admin & store owner screens – use lazy() to survive Turbopack SWC crashes
const AdminPanelScreen = lazy(() => import('@/components/screens/AdminPanelScreen'))
const AdminStoreCreateScreen = lazy(() => import('@/components/screens/AdminStoreCreateScreen'))
const AdminStoreDetailScreen = lazy(() => import('@/components/screens/AdminStoreDetailScreen'))
const AdminStoreEditScreen = lazy(() => import('@/components/screens/AdminStoreEditScreen'))
const StoreDashboardScreen = lazy(() => import('@/components/screens/StoreDashboardScreen'))
const StoreMedicinesScreen = lazy(() => import('@/components/screens/StoreMedicinesScreen'))
const StoreMedicineAddScreen = lazy(() => import('@/components/screens/StoreMedicineAddScreen'))
const StoreProfileEditScreen = lazy(() => import('@/components/screens/StoreProfileEditScreen'))
const StoreAnalyticsScreen = lazy(() => import('@/components/screens/StoreAnalyticsScreen'))
const StorePromotionsScreen = lazy(() => import('@/components/screens/StorePromotionsScreen'))
const StoreInsightsScreen = lazy(() => import('@/components/screens/StoreInsightsScreen'))

import BottomNav from '@/components/layout/BottomNav'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const pageTransition = {
  type: "tween" as const,
  ease: 'easeOut',
  duration: 0.2,
}

// Admin & store owner screens
const adminScreens: AppScreen[] = ['admin-panel', 'admin-store-create', 'admin-store-detail', 'admin-store-edit']
const storeScreens: AppScreen[] = ['store-dashboard', 'store-medicines', 'store-medicine-add', 'store-profile-edit', 'store-analytics', 'store-promotions', 'store-insights']

// New customer screens that hide bottom nav (full-screen experiences)
const fullScreenCustomerScreens: AppScreen[] = [
  'prescription-scanner', 'medicine-substitutes', 'medicine-reminders', 'drug-interaction',
  'medicine-encyclopedia', 'refill-tracker', 'health-tips', 'dosage-calculator',
  'pharmacy-reviews', 'community-forum', 'find-doctor', 'symptom-checker',
  'ai-assistant', 'wishlist', 'family-profiles', 'category-browse', 'map-view'
]

function ScreenRouter() {
  const { currentScreen, isAuthenticated, user, navigate } = useAppStore()

  // Role-based redirect on reload
  const resolvedScreen = (() => {
    if (!isAuthenticated) return 'login'
    if (currentScreen === 'login') {
      if (user?.role === 'admin') return 'admin-panel'
      if (user?.role === 'store_owner') return 'store-dashboard'
      return 'dashboard'
    }
    return currentScreen
  })()

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <motion.div
        key="login"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="w-full"
      >
        <LoginScreen />
      </motion.div>
    )
  }

  const isAdmin = user?.role === 'admin'
  const isStoreOwner = user?.role === 'store_owner'
  const isCustomer = !isAdmin && !isStoreOwner

  // Admin/store owner screens use full-width layout without sidebar/nav
  const isPortalScreen = adminScreens.includes(resolvedScreen) || storeScreens.includes(resolvedScreen)

  // Determine which screens show the top bar (customer only)
  const screensWithTopBar: AppScreen[] = [
    'dashboard', 'search', 'search-results', 'notifications', 'profile', 'settings', 'saved-locations'
  ]
  const showTopBar = !isPortalScreen && screensWithTopBar.includes(resolvedScreen)

  // Determine which screens show the back button in top bar
  const screensWithBack: AppScreen[] = [
    'search', 'search-results', 'pharmacy-detail', 'notifications', 'settings', 'location-select', 'saved-locations'
  ]
  const showBack = screensWithBack.includes(resolvedScreen)

  // Screens that hide the bottom nav
  const hideBottomNav: AppScreen[] = ['login', 'location-select', ...fullScreenCustomerScreens, ...adminScreens, ...storeScreens]
  const showBottomNav = !hideBottomNav.includes(resolvedScreen)

  const renderScreen = () => {
    switch (resolvedScreen) {
      // Core customer screens
      case 'dashboard':
        return <DashboardScreen />
      case 'search':
        return <SearchScreen />
      case 'search-results':
        return <SearchResultsScreen />
      case 'pharmacy-detail':
        return <PharmacyDetailScreen />
      case 'notifications':
        return <NotificationsScreen />
      case 'profile':
        return <ProfileScreen />
      case 'settings':
        return <SettingsScreen />
      case 'location-select':
        return <LocationSelectScreen />
      case 'saved-locations':
        return <SavedLocationsScreen />
      case 'prescription-scanner':
        return <PrescriptionScannerScreen />
      case 'medicine-substitutes':
        return <MedicineSubstitutesScreen />
      // New customer screens
      case 'medicine-reminders':
        return <MedicineRemindersScreen />
      case 'drug-interaction':
        return <DrugInteractionScreen />
      case 'medicine-encyclopedia':
        return <MedicineEncyclopediaScreen />
      case 'refill-tracker':
        return <RefillTrackerScreen />
      case 'health-tips':
        return <HealthTipsScreen />
      case 'dosage-calculator':
        return <DosageCalculatorScreen />
      case 'pharmacy-reviews':
        return <PharmacyReviewsScreen />
      case 'community-forum':
        return <CommunityForumScreen />
      case 'find-doctor':
        return <FindDoctorScreen />
      case 'symptom-checker':
        return <SymptomCheckerScreen />
      case 'ai-assistant':
        return <AIAssistantScreen />
      case 'wishlist':
        return <WishlistScreen />
      case 'family-profiles':
        return <FamilyProfilesScreen />
      case 'category-browse':
        return <CategoryBrowseScreen />
      case 'map-view':
        return <MapViewScreen />
      // Admin screens
      case 'admin-panel':
        return <AdminPanelScreen />
      case 'admin-store-create':
        return <AdminStoreCreateScreen />
      case 'admin-store-detail':
        return <AdminStoreDetailScreen />
      case 'admin-store-edit':
        return <AdminStoreEditScreen />
      // Store owner screens
      case 'store-dashboard':
        return <StoreDashboardScreen />
      case 'store-medicines':
        return <StoreMedicinesScreen />
      case 'store-medicine-add':
        return <StoreMedicineAddScreen />
      case 'store-profile-edit':
        return <StoreProfileEditScreen />
      case 'store-analytics':
        return <StoreAnalyticsScreen />
      case 'store-promotions':
        return <StorePromotionsScreen />
      case 'store-insights':
        return <StoreInsightsScreen />
      default:
        return isCustomer ? <DashboardScreen /> : isAdmin ? <AdminPanelScreen /> : <StoreDashboardScreen />
    }
  }

  // Portal screens (admin/store) render without sidebar and bottom nav
  if (isPortalScreen) {
    return (
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={resolvedScreen}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {showTopBar && <TopBar showBack={showBack} />}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={resolvedScreen}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className={showBottomNav ? 'pb-20 md:pb-4' : ''}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated, user } = useAppStore()

  const isPortalUser = user?.role === 'admin' || user?.role === 'store_owner'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop Sidebar - only for customer */}
      {isAuthenticated && !isPortalUser && <DesktopSidebar />}

      {/* Mobile Sidebar (overlay) */}
      {!isPortalUser && <Sidebar />}

      {/* Main Content */}
      <div className={isAuthenticated && !isPortalUser ? 'md:ml-64' : ''}>
        {isPortalUser ? (
          <ScreenRouter />
        ) : (
          <div className="max-w-2xl mx-auto">
            <ScreenRouter />
          </div>
        )}
      </div>
    </div>
  )
}