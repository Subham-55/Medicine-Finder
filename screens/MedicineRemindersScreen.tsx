'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Bell,
  Plus,
  Trash2,
  Pencil,
  Clock,
  Pill,
  CalendarDays,
  StickyNote,
  User,
  AlertCircle,
  Check,
  X,
  BellRing,
  BellOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'reminders.title': 'Medicine Reminders',
  'reminders.subtitle': 'Never miss a dose — set up reminders for you and your family',
  'reminders.addReminder': 'Add Reminder',
  'reminders.editReminder': 'Edit Reminder',
  'reminders.activeReminders': 'Active Reminders',
  'reminders.inactiveReminders': 'Inactive Reminders',
  'reminders.empty.title': 'No Reminders Yet',
  'reminders.empty.desc': 'Tap the button above to create your first medicine reminder.',
  'reminders.inactiveEmpty.title': 'No Inactive Reminders',
  'reminders.inactiveEmpty.desc': 'All your reminders are active. Great job staying on track!',
  'reminders.medicineName': 'Medicine Name',
  'reminders.medicinePlaceholder': 'e.g. Paracetamol 500mg',
  'reminders.dosage': 'Dosage',
  'reminders.dosagePlaceholder': 'e.g. 1 tablet',
  'reminders.frequency': 'Frequency',
  'reminders.time': 'Time',
  'reminders.startTime': 'Start Time',
  'reminders.endTime': 'End Time',
  'reminders.startDate': 'Start Date',
  'reminders.endDate': 'End Date (Optional)',
  'reminders.notes': 'Notes',
  'reminders.notesPlaceholder': 'Take after food, with water...',
  'reminders.assignTo': 'Assign to',
  'reminders.me': 'Me',
  'reminders.save': 'Save Reminder',
  'reminders.cancel': 'Cancel',
  'reminders.delete': 'Delete',
  'reminders.edit': 'Edit',
  'reminders.deleted': 'Reminder deleted',
  'reminders.saved': 'Reminder saved',
  'reminders.updated': 'Reminder updated',
  'reminders.error': 'Failed to save reminder. Please try again.',
  'reminders.loadError': 'Failed to load reminders.',
  'reminders.onceDaily': 'Once daily',
  'reminders.twiceDaily': 'Twice daily',
  'reminders.threeTimes': 'Three times daily',
  'reminders.custom': 'Custom',
  'reminders.morning': 'Morning',
  'reminders.afternoon': 'Afternoon',
  'reminders.night': 'Night',
  'reminders.confirmDelete': 'Are you sure you want to delete this reminder?',
  'reminders.everyone': 'Everyone',
}

// Types
interface Reminder {
  id: string
  medicineName: string
  dosage: string
  frequency: string
  times: string[]
  startDate: string
  endDate?: string
  notes?: string
  assignedTo: string
  active: boolean
  createdAt: string
}

interface ReminderFormData {
  medicineName: string
  dosage: string
  frequency: string
  times: string[]
  startDate: string
  endDate: string
  notes: string
  assignedTo: string
}

const FREQUENCY_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times', label: 'Three times daily' },
  { value: 'custom', label: 'Custom' },
]

const DEFAULT_TIMES: Record<string, string[]> = {
  once_daily: ['08:00'],
  twice_daily: ['08:00', '20:00'],
  three_times: ['08:00', '14:00', '20:00'],
  custom: ['08:00'],
}

function getTimeOfDay(time: string): 'morning' | 'afternoon' | 'night' {
  const hour = parseInt(time.split(':')[0], 10)
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'night'
}

function getTimeColor(tod: string) {
  switch (tod) {
    case 'morning':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    case 'afternoon':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800'
    case 'night':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200 dark:border-violet-800'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getTimeLabel(tod: string) {
  switch (tod) {
    case 'morning': return '☀️'
    case 'afternoon': return '🌤️'
    case 'night': return '🌙'
    default: return ''
  }
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}

const emptyForm: ReminderFormData = {
  medicineName: '',
  dosage: '',
  frequency: 'once_daily',
  times: ['08:00'],
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  notes: '',
  assignedTo: 'me',
}

export default function MedicineRemindersScreen() {
  const language = useAppStore((s) => s.language)
  const { t } = useTranslation(language)
  const goBack = useAppStore((s) => s.goBack)

  const st = useCallback(
    (key: string) => {
      const val = t(key)
      return val === key && fallback[key] ? fallback[key] : val
    },
    [t]
  )

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ReminderFormData>({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/reminders')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setReminders(Array.isArray(data) ? data : data.reminders || [])
    } catch {
      toast.error(st('reminders.loadError'))
      setReminders([])
    } finally {
      setIsLoading(false)
    }
  }, [st])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  // Open dialog for new
  const handleAdd = useCallback(() => {
    setEditingId(null)
    setForm({ ...emptyForm, startDate: new Date().toISOString().split('T')[0] })
    setDialogOpen(true)
  }, [])

  // Open dialog for edit
  const handleEdit = useCallback((reminder: Reminder) => {
    setEditingId(reminder.id)
    setForm({
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      frequency: reminder.frequency,
      times: reminder.times,
      startDate: reminder.startDate,
      endDate: reminder.endDate || '',
      notes: reminder.notes || '',
      assignedTo: reminder.assignedTo,
    })
    setDialogOpen(true)
  }, [])

  // Save (create or update)
  const handleSave = useCallback(async () => {
    if (!form.medicineName.trim()) {
      toast.error('Please enter a medicine name')
      return
    }
    if (!form.dosage.trim()) {
      toast.error('Please enter the dosage')
      return
    }
    if (form.times.length === 0) {
      toast.error('Please add at least one time')
      return
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/reminders?id=${editingId}` : '/api/reminders'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          endDate: form.endDate || undefined,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(editingId ? st('reminders.updated') : st('reminders.saved'))
      setDialogOpen(false)
      fetchReminders()
    } catch {
      toast.error(st('reminders.error'))
    } finally {
      setSaving(false)
    }
  }, [form, editingId, st, fetchReminders])

  // Delete
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Delete failed')
        toast.success(st('reminders.deleted'))
        fetchReminders()
      } catch {
        toast.error(st('reminders.error'))
      }
    },
    [st, fetchReminders]
  )

  // Toggle active
  const handleToggle = useCallback(
    async (reminder: Reminder) => {
      try {
        const res = await fetch(`/api/reminders?id=${reminder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: !reminder.active }),
        })
        if (!res.ok) throw new Error('Toggle failed')
        fetchReminders()
      } catch {
        toast.error(st('reminders.error'))
      }
    },
    [st, fetchReminders]
  )

  // Form helpers
  const updateForm = useCallback(<K extends keyof ReminderFormData>(key: K, value: ReminderFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Auto-adjust times when frequency changes
      if (key === 'frequency' && FREQUENCY_OPTIONS.find((f) => f.value === value)) {
        next.times = [...DEFAULT_TIMES[value as string] || ['08:00']]
      }
      return next
    })
  }, [])

  const addTime = useCallback(() => {
    setForm((prev) => ({ ...prev, times: [...prev.times, '12:00'] }))
  }, [])

  const updateTime = useCallback((index: number, value: string) => {
    setForm((prev) => {
      const times = [...prev.times]
      times[index] = value
      return { ...prev, times }
    })
  }, [])

  const removeTime = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }))
  }, [])

  const activeReminders = reminders.filter((r) => r.active)
  const inactiveReminders = reminders.filter((r) => !r.active)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto w-full">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={goBack} aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="size-5 text-primary shrink-0" />
            <h1 className="text-lg font-bold truncate">{st('reminders.title')}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        {/* Subtitle */}
        <motion.p
          className="text-muted-foreground text-sm mb-6 text-center"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {st('reminders.subtitle')}
        </motion.p>

        {/* Add Reminder Button */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button onClick={handleAdd} className="w-full h-12 gap-2 text-base">
            <Plus className="size-5" />
            {st('reminders.addReminder')}
          </Button>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8">
            {/* Active Reminders */}
            <motion.section variants={fadeUp}>
              <div className="flex items-center gap-2 mb-4">
                <BellRing className="size-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold">{st('reminders.activeReminders')}</h2>
                <Badge variant="secondary" className="ml-auto">{activeReminders.length}</Badge>
              </div>

              {activeReminders.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center py-10 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Bell className="size-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{st('reminders.empty.title')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{st('reminders.empty.desc')}</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {activeReminders.map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        variants={fadeUp}
                        layout
                        exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            {/* Top row: name + controls */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-bold text-base truncate">{reminder.medicineName}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <Pill className="size-3.5 shrink-0" />
                                  {reminder.dosage}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(reminder)} aria-label="Edit">
                                  <Pencil className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDelete(reminder.id)} aria-label="Delete">
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Times with color coding */}
                            <div className="flex flex-wrap gap-2">
                              {reminder.times.map((time, i) => {
                                const tod = getTimeOfDay(time)
                                return (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className={`gap-1.5 text-xs font-medium ${getTimeColor(tod)}`}
                                  >
                                    <span>{getTimeLabel(tod)}</span>
                                    {formatTime(time)}
                                  </Badge>
                                )
                              })}
                              <Badge variant="secondary" className="text-xs">
                                {FREQUENCY_OPTIONS.find((f) => f.value === reminder.frequency)?.label || reminder.frequency}
                              </Badge>
                            </div>

                            {/* Bottom row: date + assignee + toggle */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/50">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="size-3" />
                                  {reminder.startDate}
                                </span>
                                {reminder.assignedTo && reminder.assignedTo !== 'me' && (
                                  <span className="flex items-center gap-1">
                                    <User className="size-3" />
                                    {reminder.assignedTo}
                                  </span>
                                )}
                              </div>
                              <Switch
                                checked={reminder.active}
                                onCheckedChange={() => handleToggle(reminder)}
                                aria-label="Toggle reminder"
                              />
                            </div>

                            {/* Notes */}
                            {reminder.notes && (
                              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                                <StickyNote className="size-3.5 mt-0.5 shrink-0" />
                                <span>{reminder.notes}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.section>

            {/* Inactive Reminders */}
            {inactiveReminders.length > 0 && (
              <motion.section variants={fadeUp}>
                <div className="flex items-center gap-2 mb-4">
                  <BellOff className="size-5 text-muted-foreground" />
                  <h2 className="text-base font-bold">{st('reminders.inactiveReminders')}</h2>
                  <Badge variant="secondary" className="ml-auto">{inactiveReminders.length}</Badge>
                </div>
                <div className="space-y-3 opacity-60">
                  {inactiveReminders.map((reminder) => (
                    <motion.div key={reminder.id} variants={fadeUp} layout>
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-bold text-base truncate line-through decoration-muted-foreground">{reminder.medicineName}</h3>
                              <p className="text-sm text-muted-foreground">{reminder.dosage}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(reminder)} aria-label="Edit">
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDelete(reminder.id)} aria-label="Delete">
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-border/50">
                            <div className="flex flex-wrap gap-2">
                              {reminder.times.map((time, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {formatTime(time)}
                                </Badge>
                              ))}
                            </div>
                            <Switch
                              checked={reminder.active}
                              onCheckedChange={() => handleToggle(reminder)}
                              aria-label="Toggle reminder"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </motion.div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil className="size-5 text-primary" />
                  {st('reminders.editReminder')}
                </>
              ) : (
                <>
                  <Plus className="size-5 text-primary" />
                  {st('reminders.addReminder')}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Medicine Name */}
            <div className="space-y-2">
              <Label>{st('reminders.medicineName')}</Label>
              <Input
                value={form.medicineName}
                onChange={(e) => updateForm('medicineName', e.target.value)}
                placeholder={st('reminders.medicinePlaceholder')}
              />
            </div>

            {/* Dosage */}
            <div className="space-y-2">
              <Label>{st('reminders.dosage')}</Label>
              <Input
                value={form.dosage}
                onChange={(e) => updateForm('dosage', e.target.value)}
                placeholder={st('reminders.dosagePlaceholder')}
              />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label>{st('reminders.frequency')}</Label>
              <Select value={form.frequency} onValueChange={(v) => updateForm('frequency', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Times */}
            <div className="space-y-2">
              <Label>{st('reminders.time')}</Label>
              <div className="space-y-2">
                {form.times.map((time, i) => {
                  const tod = getTimeOfDay(time)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className={`shrink-0 text-xs font-medium ${getTimeColor(tod)}`}>
                        {getTimeLabel(tod)}
                      </Badge>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(i, e.target.value)}
                        className="flex-1"
                      />
                      {form.times.length > 1 && (
                        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-destructive" onClick={() => removeTime(i)}>
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={addTime}>
                  <Plus className="size-4" />
                  Add Time
                </Button>
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>{st('reminders.startDate')}</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => updateForm('startDate', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>{st('reminders.endDate')}</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => updateForm('endDate', e.target.value)}
                min={form.startDate}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{st('reminders.notes')}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateForm('notes', e.target.value)}
                placeholder={st('reminders.notesPlaceholder')}
                rows={2}
              />
            </div>

            {/* Assign To */}
            <div className="space-y-2">
              <Label>{st('reminders.assignTo')}</Label>
              <Select value={form.assignedTo} onValueChange={(v) => updateForm('assignedTo', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">{st('reminders.me')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                {st('reminders.cancel')}
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Clock className="size-4" />
                  </motion.div>
                ) : (
                  <Check className="size-4" />
                )}
                {st('reminders.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}