import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List family members for user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const members = await db.familyMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Family members GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 })
  }
}

// POST: Create family member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, relation, age, weight, gender, bloodGroup, notes } = body

    if (!userId || !name) {
      return NextResponse.json({ error: 'userId and name are required' }, { status: 400 })
    }

    const member = await db.familyMember.create({
      data: {
        userId,
        name,
        relation: relation || 'other',
        age: age || null,
        weight: weight || null,
        gender: gender || '',
        bloodGroup: bloodGroup || '',
        notes: notes || '',
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Family members POST error:', error)
    return NextResponse.json({ error: 'Failed to create family member' }, { status: 500 })
  }
}

// PUT: Update family member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, ...updateData } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    const existing = await db.familyMember.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (updateData.name !== undefined) data.name = updateData.name
    if (updateData.relation !== undefined) data.relation = updateData.relation
    if (updateData.age !== undefined) data.age = updateData.age || null
    if (updateData.weight !== undefined) data.weight = updateData.weight || null
    if (updateData.gender !== undefined) data.gender = updateData.gender
    if (updateData.bloodGroup !== undefined) data.bloodGroup = updateData.bloodGroup
    if (updateData.notes !== undefined) data.notes = updateData.notes
    if (updateData.avatar !== undefined) data.avatar = updateData.avatar

    const member = await db.familyMember.update({
      where: { id },
      data,
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Family members PUT error:', error)
    return NextResponse.json({ error: 'Failed to update family member' }, { status: 500 })
  }
}

// DELETE: Delete family member
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    const existing = await db.familyMember.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    await db.familyMember.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Family members DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete family member' }, { status: 500 })
  }
}