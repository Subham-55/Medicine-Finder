'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Pill,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

// Inline fallback translations
const fallback: Record<string, string> = {
  'family.title': 'Family Profiles',
  'family.addMember': 'Add Family Member',
  'family.editMember': 'Edit Family Member',
  'family.name': 'Name',
  'family.relation': 'Relation',
  'family.age': 'Age',
  'family.weight': 'Weight (kg)',
  'family.gender': 'Gender',
  'family.bloodGroup': 'Blood Group',
  'family.notes': 'Notes',
  'family.save': 'Save',
  'family.cancel': 'Cancel',
  'family.delete': 'Delete',
  'family.deleteWarning': 'Are you sure you want to delete this family member? This action cannot be undone.',
  'family.deleted': 'Family member deleted',
  'family.saved': 'Profile saved successfully',
  'family.saveError': 'Failed to save profile',
  'family.loadError': 'Failed to load family members',
  'family.empty': 'No family members yet',
  'family.emptyDesc': 'Add family members to manage their health profiles and medicine reminders.',
  'family.reminders': 'reminders',
  'family.years': 'yrs',
  'family.kg': 'kg',
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const sectionFade = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const RELATIONS = ['Self', 'Parent', 'Child', 'Spouse', 'Sibling', 'Other']
const GENDERS = ['Male', 'Female', 'Other']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const relationColors: Record<string, string> = {
  Self: 'bg-violet-100 text-violet-700',
  Parent: 'bg-sky-100 text-sky-700',
  Child: 'bg-amber-100 text-amber-700',
  Spouse: 'bg-rose-100 text-rose-700',
  Sibling: 'bg-emerald-100 text-emerald-700',
  Other: 'bg-neutral-100 text-neutral-700',
}

interface FamilyMember {
  id: string
  userId: string
  name: string
  relation: string
  age?: number
  weight?: number
  gender?: string
  bloodGroup?: string
  notes?: string
  reminderCount?: number
  createdAt: string
}

const defaultForm = {
  name: '',
  relation: 'Self',
  age: '',
  weight: '',
  gender: '',
  bloodGroup: '',
  notes: '',
}

export default function FamilyProfilesScreen() {
  const { user, goBack } = useAppStore()
  const language = useAppStore(s => s.language)
  const { t } = useTranslation(language)

  const tf = (key: string) => t(key) || fallback[key] || key

  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/family-members?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(Array.isArray(data) ? data : data.members || [])
      }
    } catch {
      toast.error(tf('family.loadError'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const openAdd = () => {
    setEditingMember(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (member: FamilyMember) => {
    setEditingMember(member)
    setForm({
      name: member.name,
      relation: member.relation,
      age: member.age?.toString() || '',
      weight: member.weight?.toString() || '',
      gender: member.gender || '',
      bloodGroup: member.bloodGroup || '',
      notes: member.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !user?.id) return
    setSaving(true)
    try {
      const body = {
        ...(editingMember ? { id: editingMember.id } : {}),
        userId: user.id,
        name: form.name.trim(),
        relation: form.relation,
        age: form.age ? parseInt(form.age) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        gender: form.gender || null,
        bloodGroup: form.bloodGroup || null,
        notes: form.notes.trim() || null,
      }

      const method = editingMember ? 'PUT' : 'POST'
      const res = await fetch('/api/family-members', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(tf('family.saved'))
        setDialogOpen(false)
        fetchMembers()
      } else {
        toast.error(tf('family.saveError'))
      }
    } catch {
      toast.error(tf('family.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user?.id) return
    setDeleting(true)
    try {
      const res = await fetch('/api/family-members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id, userId: user.id }),
      })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id))
        toast.success(tf('family.deleted'))
        setDeleteTarget(null)
      }
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarColors = [
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
    'bg-pink-100 text-pink-700',
  ]

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3"
        >
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
              <Users className="size-5" />
              {tf('family.title')}
            </h1>
          </div>
          <Button onClick={openAdd} className="gap-1.5" size="sm">
            <Plus className="size-4" />
            {tf('family.addMember')}
          </Button>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-dashed border-neutral-200 py-16 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-neutral-100">
                  <Users className="size-8 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{tf('family.empty')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tf('family.emptyDesc')}</p>
                </div>
                <Button size="sm" onClick={openAdd} className="mt-2 gap-1.5">
                  <Plus className="size-3.5" />
                  {tf('family.addMember')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  layout
                >
                  <Card className="border-neutral-100 py-0 shadow-none transition-colors hover:bg-neutral-50/60">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColors[i % avatarColors.length]}`}
                        >
                          {getInitials(member.name)}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-neutral-900">
                              {member.name}
                            </p>
                            <Badge
                              className={`shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold ${relationColors[member.relation] || relationColors.Other}`}
                            >
                              {member.relation}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {member.age && <span>{member.age} {tf('family.years')}</span>}
                            {member.weight && <span>{member.weight} {tf('family.kg')}</span>}
                            {member.bloodGroup && <span className="font-medium">{member.bloodGroup}</span>}
                            {member.gender && <span>{member.gender}</span>}
                          </div>
                        </div>

                        {/* Reminder count + actions */}
                        <div className="flex shrink-0 items-center gap-1">
                          {member.relation !== 'Self' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() =>
                                setExpandedMember(expandedMember === member.id ? null : member.id)
                              }
                            >
                              <Pill className="size-3.5 text-muted-foreground" />
                              {(member.reminderCount ?? 0) > 0 && (
                                <span className="ml-0.5 text-[10px] font-medium text-muted-foreground">
                                  {member.reminderCount}
                                </span>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(member)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(member)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded reminders info */}
                      <AnimatePresence>
                        {expandedMember === member.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
                              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Clock className="size-3" />
                                {member.reminderCount ?? 0} {tf('family.reminders')} for {member.name}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Notes */}
                      {member.notes && (
                        <p className="mt-2 pl-14 text-xs text-muted-foreground">{member.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? tf('family.editMember') : tf('family.addMember')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{tf('family.name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>{tf('family.relation')}</Label>
              <Select value={form.relation} onValueChange={(v) => setForm({ ...form, relation: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{tf('family.age')}</Label>
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="30"
                  min={0}
                  max={150}
                />
              </div>
              <div className="space-y-2">
                <Label>{tf('family.weight')}</Label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="70"
                  min={0}
                  step={0.5}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{tf('family.gender')}</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{tf('family.bloodGroup')}</Label>
                <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{tf('family.notes')}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any health conditions, allergies..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tf('family.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? '...' : tf('family.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tf('family.delete')} {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>{tf('family.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tf('family.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? '...' : tf('family.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}