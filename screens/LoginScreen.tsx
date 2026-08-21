'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Shield, ArrowRight, ArrowLeft, Loader2, Mail, Lock, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { mockNotifications } from '@/lib/mock-data'

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export default function LoginScreen() {
  const [authMode, setAuthMode] = useState<'customer' | 'admin'>('customer')
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [direction, setDirection] = useState(1)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  const setAuth = useAppStore((s) => s.setAuth)
  const navigate = useAppStore((s) => s.navigate)
  const setNotifications = useAppStore((s) => s.setNotifications)
  const setStoreData = useAppStore((s) => s.setStoreData)
  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)

  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  useEffect(() => {
    mobileInputRef.current?.focus()
  }, [])

  const handleSendOtp = useCallback(async () => {
    const cleaned = mobile.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      toast.error(t('login.mobile.invalid'))
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', mobile: cleaned }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t('login.mobile.sendFailed'))
      if (data._demoOtp) {
        setOtp(data._demoOtp)
        toast.success(`Demo OTP: ${data._demoOtp}`)
      }
      setDirection(1)
      setStep('otp')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }, [mobile])

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) {
      toast.error(t('login.otp.invalid'))
      return
    }
    setVerifying(true)
    try {
      const cleaned = mobile.replace(/\D/g, '')
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', mobile: cleaned, otp }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t('login.otp.failed'))
      }
      setAuth({
        id: `user-${Date.now()}`,
        name: '',
        mobile: cleaned,
        theme: 'light',
        colorTheme: 'default',
        notificationsEnabled: true,
      })
      setNotifications(mockNotifications)
      navigate('location-select')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('login.otp.failed'))
    } finally {
      setVerifying(false)
    }
  }, [mobile, otp, setAuth, navigate, setNotifications])

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return
    setSending(true)
    try {
      const cleaned = mobile.replace(/\D/g, '')
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', mobile: cleaned }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t('login.otp.resendFailed'))
      }
      setOtp('')
      setResendTimer(30)
      toast.success(t('login.otp.sent'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('login.otp.resendFailed'))
    } finally {
      setSending(false)
    }
  }, [mobile, resendTimer])

  const handleBackToMobile = useCallback(() => {
    setDirection(-1)
    setStep('mobile')
    setOtp('')
  }, [])

  const handleAdminLogin = useCallback(async () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast.error(t('login.admin.invalidInput'))
      return
    }
    setAdminLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: adminEmail.trim(), password: adminPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t('login.admin.loginFailed'))
      setAuth({
        id: data.user.id, name: data.user.name, email: data.user.email,
        mobile: data.user.mobile || '', role: data.user.role,
        theme: 'light', colorTheme: 'default', notificationsEnabled: true,
      })
      if (data.store) {
        setStoreData({
          id: data.store.id, ownerId: data.store.ownerId, name: data.store.name,
          address: data.store.address, city: data.store.city, state: data.store.state,
          country: data.store.country, phone: data.store.phone, lat: data.store.lat,
          lng: data.store.lng, isOpen: data.store.isOpen, workingHours: data.store.workingHours,
          isActive: data.store.isActive, medicineCount: data.store.medicineCount,
          createdAt: data.store.createdAt, updatedAt: data.store.updatedAt,
        })
      }
      if (data.user.role === 'admin') navigate('admin-panel')
      else if (data.user.role === 'store_owner') navigate('store-dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('login.admin.loginFailed'))
    } finally {
      setAdminLoading(false)
    }
  }, [adminEmail, adminPassword, setAuth, setStoreData, navigate])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && step === 'mobile') handleSendOtp()
    },
    [step, handleSendOtp],
  )

  const cleanedMobile = mobile.replace(/\D/g, '')
  const isMobileValid = cleanedMobile.length === 10
  const isOtpComplete = otp.length === 6

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-100 mb-4">
            <div className="relative">
              <div className="w-6 h-10 rounded-full border-2 border-neutral-800 relative">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-neutral-800 -translate-y-1/2" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t('login.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            {authMode === 'customer' ? t('login.subtitle.customer') : t('login.subtitle.admin')}
          </p>
        </motion.div>

        <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1 mb-6">
          <button
            onClick={() => setAuthMode('customer')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              authMode === 'customer'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            type="button"
          >
            <Phone className="size-3.5" />
            {t('login.tab.customer')}
          </button>
          <button
            onClick={() => setAuthMode('admin')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              authMode === 'admin'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            type="button"
          >
            <Building2 className="size-3.5" />
            {t('login.tab.admin')}
          </button>
        </div>

        {authMode === 'customer' ? (
          <motion.div
            key="customer-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <AnimatePresence mode="wait" custom={direction}>
                  {step === 'mobile' && (
                    <motion.div
                      key="mobile"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-lg font-semibold text-neutral-900">{t('login.mobile.heading')}</h2>
                          <p className="text-sm text-neutral-500 mt-1">{t('login.mobile.desc')}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 px-3 rounded-md border border-neutral-200 bg-neutral-50 text-sm text-neutral-700 font-medium shrink-0 h-9">
                              <span className="text-base leading-none">🇮🇳</span>
                              +91
                            </div>
                            <Input
                              ref={mobileInputRef}
                              type="tel"
                              placeholder={t('login.mobile.placeholder')}
                              value={mobile}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                                setMobile(val)
                              }}
                              onKeyDown={handleKeyDown}
                              className="flex-1 text-base tabular-nums"
                              maxLength={10}
                              disabled={sending}
                              aria-label={t('login.mobile.label')}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleSendOtp}
                          disabled={!isMobileValid || sending}
                          className="w-full h-11 text-sm font-medium"
                          size="lg"
                        >
                          {sending ? t('login.mobile.sending') : t('login.mobile.sendOtp')}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  {step === 'otp' && (
                    <motion.div
                      key="otp"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="space-y-5">
                        <button
                          onClick={handleBackToMobile}
                          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors -ml-1"
                          type="button"
                        >
                          <ArrowLeft className="size-4" />
                          {t('common.back')}
                        </button>
                        <div>
                          <h2 className="text-lg font-semibold text-neutral-900">{t('login.otp.heading')}</h2>
                          <p className="text-sm text-neutral-500 mt-1">
                            {t('login.otp.desc')}{' '}
                            <span className="font-medium text-neutral-700">
                              +91 {cleanedMobile}
                            </span>
                          </p>
                        </div>
                        <div className="flex justify-center py-2">
                          <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={setOtp}
                            disabled={verifying}
                            aria-label={t('login.otp.label')}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <Button
                          onClick={handleVerifyOtp}
                          disabled={!isOtpComplete || verifying}
                          className="w-full h-11 text-sm font-medium"
                          size="lg"
                        >
                          {verifying ? t('login.otp.verifying') : t('login.otp.verifyBtn')}
                        </Button>
                        <div className="text-center">
                          {resendTimer > 0 ? (
                            <p className="text-sm text-neutral-400">
                              {t('login.otp.resendIn')}{' '}
                              <span className="font-medium tabular-nums text-neutral-600">
                                {resendTimer}s
                              </span>
                            </p>
                          ) : (
                            <button
                              onClick={handleResendOtp}
                              disabled={sending}
                              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              type="button"
                            >
                              {sending ? t('login.otp.sending') : t('login.otp.resendBtn')}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="admin-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">{t('login.admin.heading')}</h2>
                  <p className="text-sm text-neutral-500 mt-1">{t('login.admin.desc')}</p>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <Input
                      type="email"
                      placeholder={t('login.admin.emailPlaceholder')}
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="pl-10"
                      disabled={adminLoading}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                      aria-label={t('login.admin.emailLabel')}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <Input
                      type="password"
                      placeholder={t('login.admin.passwordPlaceholder')}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="pl-10"
                      disabled={adminLoading}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                      aria-label={t('login.admin.passwordLabel')}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAdminLogin}
                  disabled={adminLoading}
                  className="w-full h-11 text-sm font-medium"
                  size="lg"
                >
                  {adminLoading ? t('login.admin.signingIn') : t('login.admin.signInBtn')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-neutral-400 text-center mt-6"
        >
          {t('login.terms.pre')}{' '}
          <span className="underline cursor-pointer hover:text-neutral-600 transition-colors">{t('login.terms.service')}</span>{' '}
          {t('login.terms.and')}{' '}
          <span className="underline cursor-pointer hover:text-neutral-600 transition-colors">{t('login.terms.privacy')}</span>
        </motion.p>
      </div>
    </div>
  )
}