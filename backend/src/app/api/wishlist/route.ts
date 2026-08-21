import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List wishlist items for user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const items = await db.wishlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Wishlist GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

// POST: Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, medicineName, genericName, category, dosage, notes, storeId } = body

    if (!userId || !medicineName) {
      return NextResponse.json({ error: 'userId and medicineName are required' }, { status: 400 })
    }

    const item = await db.wishlistItem.create({
      data: {
        userId,
        medicineName,
        genericName: genericName || '',
        category: category || '',
        dosage: dosage || '',
        notes: notes || '',
        storeId: storeId || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Wishlist POST error:', error)
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

// DELETE: Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    const existing = await db.wishlistItem.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 })
    }

    await db.wishlistItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wishlist DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}