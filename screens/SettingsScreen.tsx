'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import LanguageSelector from '@/components/ui/LanguageSelector'
import { useTheme } from 'next-themes'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Bell,
  MapPin,
  Shield,
  FileText,
  Info,
  Star,
  MessageCircle,
  ChevronRight,
  Check,
  Palette,
  Globe,
} from 'lucide-react'

// ── Color Theme Definitions ────────────────────────────────────────
const colorThemes = [
  {
    id: 'default',
    name: 'Default',
    light: '#171717',
    dark: '#e5e5e5',
    previewBg: '#f5f5f5',
    previewAccent: '#171717',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    light: '#059669',
    dark: '#34d399',
    previewBg: '#ecfdf5',
    previewAccent: '#059669',
  },
  {
    id: 'sage',
    name: 'Sage',
    light: '#6b8e5a',
    dark: '#8cb87a',
    previewBg: '#f2f6ef',
    previewAccent: '#6b8e5a',
  },
  {
    id: 'mint',
    name: 'Mint',
    light: '#0d9488',
    dark: '#2dd4bf',
    previewBg: '#f0fdfa',
    previewAccent: '#0d9488',
  },
  {
    id: 'rose',
    name: 'Rose',
    light: '#e11d48',
    dark: '#fb7185',
    previewBg: '#fff1f2',
    previewAccent: '#e11d48',
  },
  {
    id: 'peach',
    name: 'Peach',
    light: '#e07c4f',
    dark: '#f0a07a',
    previewBg: '#fef5ef',
    previewAccent: '#e07c4f',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    light: '#d4622a',
    dark: '#f08c55',
    previewBg: '#fff4ed',
    previewAccent: '#d4622a',
  },
  {
    id: 'amber',
    name: 'Amber',
    light: '#d97706',
    dark: '#fbbf24',
    previewBg: '#fffbeb',
    previewAccent: '#d97706',
  },
  {
    id: 'violet',
    name: 'Violet',
    light: '#7c3aed',
    dark: '#a78bfa',
    previewBg: '#f5f3ff',
    previewAccent: '#7c3aed',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    light: '#0891b2',
    dark: '#22d3ee',
    previewBg: '#ecfeff',
    previewAccent: '#0891b2',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    light: '#dc2626',
    dark: '#f87171',
    previewBg: '#fef2f2',
    previewAccent: '#dc2626',
  },
  {
    id: 'slate',
    name: 'Slate',
    light: '#64748b',
    dark: '#94a3b8',
    previewBg: '#f8fafc',
    previewAccent: '#64748b',
  },
]

function SectionHeader({
  title,
  icon: Icon,
}: {
  title: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
    </div>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function MenuRow({
  label,
  icon: Icon,
  onClick,
}: {
  label: string
  icon: React.ElementType
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full py-3 text-left hover:bg-muted/50 transition-colors rounded-md px-1"
    >
      <Icon className="h-4.5 w-4.5 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

// ── Theme Swatch Component ─────────────────────────────────────────
function ThemeSwatch({
  theme,
  isSelected,
  isDark,
  onClick,
  t,
}: {
  theme: typeof colorThemes[number]
  isSelected: boolean
  isDark: boolean
  onClick: () => void
  t: (key: string) => string
}) {
  const color = isDark ? theme.dark : theme.light
  const previewBg = isDark ? '#1a1a2e' : theme.previewBg
  const previewAccent = isDark ? theme.dark : theme.previewAccent

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      className="flex flex-col items-center gap-2.5 group"
    >
      {/* Outer ring + color circle */}
      <div className="relative">
        {/* Selection ring */}
        <motion.div
          className="absolute -inset-1.5 rounded-full"
          animate={{
            boxShadow: isSelected
              ? `0 0 0 3px ${color}40, 0 0 0 5px ${color}20`
              : '0 0 0 0px transparent',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
        {/* Main color circle */}
        <div
          className="relative flex size-12 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110 sm:size-14"
          style={{ backgroundColor: color }}
        >
          {/* Checkmark for selected */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <Check
                className="size-5 sm:size-6"
                style={{ color: isDark && ['amber', 'peach', 'sage', 'mint', 'default', 'slate'].includes(theme.id) ? '#171717' : '#ffffff' }}
                strokeWidth={3}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Theme name */}
      <span
        className={`text-[11px] font-medium transition-colors ${
          isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
        }`}
      >
        {t(`settings.theme.${theme.id}`)}
      </span>
    </motion.button>
  )
}

// ── Theme Preview Card ────────────────────────────────────────────
function ThemePreview({ themeId, isDark }: { themeId: string; isDark: boolean }) {
  const theme = colorThemes.find((t) => t.id === themeId) || colorThemes[0]
  const color = isDark ? theme.dark : theme.light
  const bgColor = isDark ? '#1a1a2e' : theme.previewBg

  return (
    <div
      className="mt-4 rounded-xl border overflow-hidden shadow-sm"
      style={{ backgroundColor: isDark ? '#1e1e2e' : '#ffffff' }}
    >
      {/* Mini header bar */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: color }}>
        <div className="flex gap-1.5">
          <div className="size-2 rounded-full opacity-60" style={{ backgroundColor: isDark ? theme.dark : '#ffffff' }} />
          <div className="size-2 rounded-full opacity-40" style={{ backgroundColor: isDark ? theme.dark : '#ffffff' }} />
          <div className="size-2 rounded-full opacity-30" style={{ backgroundColor: isDark ? theme.dark : '#ffffff' }} />
        </div>
        <div
          className="ml-auto h-3.5 w-16 rounded-md opacity-30"
          style={{ backgroundColor: isDark ? theme.dark : '#ffffff' }}
        />
      </div>

      {/* Mini content */}
      <div className="p-3 space-y-2.5">
        {/* Primary button */}
        <div
          className="h-7 w-24 rounded-lg shadow-sm"
          style={{ backgroundColor: color }}
        />
        {/* Text lines */}
        <div className="space-y-1.5">
          <div
            className="h-2 w-full rounded"
            style={{ backgroundColor: isDark ? '#333350' : '#f0f0f0' }}
          />
          <div
            className="h-2 w-3/4 rounded"
            style={{ backgroundColor: isDark ? '#333350' : '#f0f0f0' }}
          />
        </div>
        {/* Accent tags */}
        <div className="flex gap-1.5">
          <div
            className="h-5 w-14 rounded-md"
            style={{ backgroundColor: color + '18' }}
          />
          <div
            className="h-5 w-14 rounded-md"
            style={{ backgroundColor: color + '18' }}
          />
          <div
            className="h-5 w-10 rounded-md"
            style={{ backgroundColor: isDark ? '#333350' : '#f0f0f0' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function SettingsScreen() {
  const { user, updateUser, goBack } = useAppStore()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const isDark = resolvedTheme === 'dark'
  const currentColorTheme = user?.colorTheme || 'default'

  const handleColorThemeChange = (themeId: string) => {
    updateUser({ colorTheme: themeId })
    toast.success(t('settings.themeChanged', { theme: colorThemes.find((ct) => ct.id === themeId)?.name || themeId }))
  }

  const handleNotificationToggle = (enabled: boolean) => {
    updateUser({ notificationsEnabled: enabled })
    toast.success(
      enabled ? t('settings.pushEnabled') : t('settings.pushDisabled')
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto px-4 pb-8"
      >
        {/* ── Language ──────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('settings.language')} icon={Globe} />
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">{t('settings.languageDesc')}</p>
              <LanguageSelector />
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Color Theme ────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('settings.colorTheme')} icon={Palette} />
          <Card>
            <CardContent className="p-4">
              {/* Theme swatches grid */}
              <div className="grid grid-cols-4 gap-y-5 sm:grid-cols-6 sm:gap-x-2">
                {colorThemes.map((ct) => (
                  <ThemeSwatch
                    key={ct.id}
                    theme={ct}
                    isSelected={currentColorTheme === ct.id}
                    isDark={isDark}
                    onClick={() => handleColorThemeChange(ct.id)}
                    t={t}
                  />
                ))}
              </div>

              {/* Live preview */}
              <ThemePreview themeId={currentColorTheme} isDark={isDark} />
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Appearance (Dark Mode) ─────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('settings.appearance')} icon={Sun} />
          <Card>
            <CardContent className="p-4">
              <RadioGroup
                value={theme}
                onValueChange={(value) => {
                  setTheme(value)
                  updateUser({ theme: value })
                }}
                className="gap-0"
              >
                <div className="flex items-center gap-3 py-3">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light" className="flex items-center gap-2.5 flex-1 cursor-pointer">
                    <Sun className="h-4.5 w-4.5 text-amber-500" />
                    <span className="text-sm font-medium">{t('settings.light')}</span>
                  </Label>
                </div>
                <Separator />
                <div className="flex items-center gap-3 py-3">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark" className="flex items-center gap-2.5 flex-1 cursor-pointer">
                    <Moon className="h-4.5 w-4.5 text-slate-400" />
                    <span className="text-sm font-medium">{t('settings.dark')}</span>
                  </Label>
                </div>
                <Separator />
                <div className="flex items-center gap-3 py-3">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system" className="flex items-center gap-2.5 flex-1 cursor-pointer">
                    <Monitor className="h-4.5 w-4.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('settings.system')}</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Notifications ──────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('settings.notifications')} icon={Bell} />
          <Card>
            <CardContent className="px-4">
              <SettingRow
                label={t('settings.pushNotifications')}
                description={t('settings.pushNotificationsDesc')}
              >
                <Switch
                  checked={user?.notificationsEnabled ?? true}
                  onCheckedChange={handleNotificationToggle}
                />
              </SettingRow>
              <Separator />
              <SettingRow
                label={t('settings.availabilityAlerts')}
                description={t('settings.availabilityAlertsDesc')}
              >
                <Switch defaultChecked />
              </SettingRow>
              <Separator />
              <SettingRow
                label={t('settings.priceDropAlerts')}
                description={t('settings.priceDropAlertsDesc')}
              >
                <Switch defaultChecked />
              </SettingRow>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Location ───────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('settings.location')} icon={MapPin} />
          <Card>
            <CardContent className="px-4">
              <SettingRow
                label={t('settings.locationPermission')}
                description={
                  typeof navigator !== 'undefined' &&
                  'geolocation' in navigator
                    ? t('settings.locationGranted')
                    : t('settings.locationNotGranted')
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      typeof navigator !== 'undefined' &&
                      'geolocation' in navigator
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {typeof navigator !== 'undefined' &&
                    'geolocation' in navigator
                      ? t('settings.locationGranted')
                      : t('settings.locationNotGranted')}
                  </span>
                </div>
              </SettingRow>
              <Separator />
              <SettingRow
                label={t('settings.manageLocation')}
                description={t('settings.locationDesc')}
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </SettingRow>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Privacy & Legal ────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('settings.privacyLegal')} icon={Shield} />
          <Card>
            <CardContent className="px-1">
              <MenuRow
                label={t('settings.privacyPolicy')}
                icon={FileText}
                onClick={() => toast.info(t('profile.comingSoon'))}
              />
              <Separator className="ml-10" />
              <MenuRow
                label={t('settings.termsConditions')}
                icon={FileText}
                onClick={() => toast.info(t('profile.comingSoon'))}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* ── About ──────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6">
          <SectionHeader title={t('settings.about')} icon={Info} />
          <Card>
            <CardContent className="px-1">
              <div className="flex items-center gap-3 py-3 px-1">
                <Info className="h-4.5 w-4.5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{t('settings.appVersion')}</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <Separator className="ml-10" />
              <MenuRow
                label={t('settings.contactSupport')}
                icon={MessageCircle}
                onClick={() => toast.info(t('profile.comingSoon'))}
              />
              <Separator className="ml-10" />
              <MenuRow
                label={t('settings.rateApp')}
                icon={Star}
                onClick={() => toast.info(t('profile.comingSoon'))}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}