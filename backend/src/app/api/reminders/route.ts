import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List reminders for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const reminders = await db.medicineReminder.findMany({
      where: { userId },
      include: {
        familyMember: {
          select: { id: true, name: true, relation: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Reminders GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

// POST: Create reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, medicineName, dosage, frequency, times, startDate, endDate, isActive, notes, familyMemberId } = body

    if (!userId || !medicineName) {
      return NextResponse.json({ error: 'userId and medicineName are required' }, { status: 400 })
    }

    const reminder = await db.medicineReminder.create({
      data: {
        userId,
        medicineName,
        dosage: dosage || '',
        frequency: frequency || 'daily',
        times: times || '08:00',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : true,
        notes: notes || '',
        familyMemberId: familyMemberId || null,
      },
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error('Reminders POST error:', error)
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
  }
}

// PUT: Update reminder
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, ...updateData } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.medicineReminder.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (updateData.medicineName !== undefined) data.medicineName = updateData.medicineName
    if (updateData.dosage !== undefined) data.dosage = updateData.dosage
    if (updateData.frequency !== undefined) data.frequency = updateData.frequency
    if (updateData.times !== undefined) data.times = updateData.times
    if (updateData.startDate !== undefined) data.startDate = new Date(updateData.startDate)
    if (updateData.endDate !== undefined) data.endDate = updateData.endDate ? new Date(updateData.endDate) : null
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive
    if (updateData.notes !== undefined) data.notes = updateData.notes
    if (updateData.familyMemberId !== undefined) data.familyMemberId = updateData.familyMemberId || null

    const reminder = await db.medicineReminder.update({
      where: { id },
      data,
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Reminders PUT error:', error)
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}

// DELETE: Delete reminder
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.medicineReminder.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    await db.medicineReminder.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reminders DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
  }
}