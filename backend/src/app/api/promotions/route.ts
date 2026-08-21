import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List active promotions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const storeId = searchParams.get('storeId')
    const city = searchParams.get('city')

    const now = new Date()

    const where: Record<string, unknown> = {
      isActive: true,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    }

    if (storeId) {
      where.storeId = storeId
    }

    const promotions = await db.promotion.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true, city: true, address: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by city if specified (after join since city is on store)
    const filtered = city
      ? promotions.filter(p => p.store.city.toLowerCase().includes(city.toLowerCase()))
      : promotions

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Promotions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
  }
}

// POST: Create promotion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      storeId, title, description, discountPercent, code,
      startDate, endDate, promoType,
    } = body

    if (!storeId || !title) {
      return NextResponse.json({ error: 'storeId and title are required' }, { status: 400 })
    }

    const promotion = await db.promotion.create({
      data: {
        storeId,
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
    console.error('Promotions POST error:', error)
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 })
  }
}

// PUT: Update promotion
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, storeId, ...updateData } = body

    if (!id || !storeId) {
      return NextResponse.json({ error: 'id and storeId are required' }, { status: 400 })
    }

    const existing = await db.promotion.findFirst({ where: { id, storeId } })
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
    console.error('Promotions PUT error:', error)
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 })
  }
}

// DELETE: Delete promotion
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, storeId } = body

    if (!id || !storeId) {
      return NextResponse.json({ error: 'id and storeId are required' }, { status: 400 })
    }

    const existing = await db.promotion.findFirst({ where: { id, storeId } })
    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    await db.promotion.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Promotions DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 })
  }
}