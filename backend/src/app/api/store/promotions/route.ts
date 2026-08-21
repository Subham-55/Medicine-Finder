import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List promotions for store owner
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    if (!userId) {
      return NextResponse.json({ error: 'X-User-Id header is required' }, { status: 400 })
    }

    const store = await db.store.findUnique({
      where: { ownerId: userId },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const promotions = await db.promotion.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(promotions)
  } catch (error) {
    console.error('Store promotions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
  }
}

// POST: Create promotion for store owner
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    if (!userId) {
      return NextResponse.json({ error: 'X-User-Id header is required' }, { status: 400 })
    }

    const store = await db.store.findUnique({
      where: { ownerId: userId },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title, description, discountPercent, code,
      startDate, endDate, promoType,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const promotion = await db.promotion.create({
      data: {
        storeId: store.id,
        title,
        description: description || '',
        discountPercent: discountPercent || 0,
        code: code || '',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        promoType: promoType || 'discount',
      },
    })

    return NextResponse.json(promotion, { status: 201 })
  } catch (error) {
    console.error('Store promotions POST error:', error)
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 })
  }
}

// PUT: Update promotion
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    if (!userId) {
      return NextResponse.json({ error: 'X-User-Id header is required' }, { status: 400 })
    }

    const store = await db.store.findUnique({
      where: { ownerId: userId },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify promotion belongs to this store
    const existing = await db.promotion.findFirst({ where: { id, storeId: store.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (updateData.title !== undefined) data.title = updateData.title
    if (updateData.description !== undefined) data.description = updateData.description
    if (updateData.discountPercent !== undefined) data.discountPercent = updateData.discountPercent
    if (updateData.code !== undefined) data.code = updateData.code
    if (updateData.startDate !== undefined) data.startDate = new Date(updateData.startDate)
    if (updateData.endDate !== undefined) data.endDate = updateData.endDate ? new Date(updateData.endDate) : null
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive
    if (updateData.promoType !== undefined) data.promoType = updateData.promoType

    const promotion = await db.promotion.update({
      where: { id },
      data,
    })

    return NextResponse.json(promotion)
  } catch (error) {
    console.error('Store promotions PUT error:', error)
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 })
  }
}

// DELETE: Delete promotion
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    if (!userId) {
      return NextResponse.json({ error: 'X-User-Id header is required' }, { status: 400 })
    }

    const store = await db.store.findUnique({
      where: { ownerId: userId },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const existing = await db.promotion.findFirst({ where: { id, storeId: store.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    await db.promotion.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Store promotions DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 })
  }
}