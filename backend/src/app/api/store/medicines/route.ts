import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: verify store ownership via userId header
async function getStoreForOwner(userId: string) {
  const store = await db.store.findUnique({
    where: { ownerId: userId },
  })
  return store
}

// GET: List medicines for the authenticated store
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const store = await getStoreForOwner(userId)

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found for this user' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const where: Record<string, unknown> = { storeId: store.id }

    if (search || category) {
      const and: Record<string, unknown>[] = []
      if (search) {
        and.push({
          OR: [
            { name: { contains: search } },
            { genericName: { contains: search } },
            { manufacturer: { contains: search } },
          ],
        })
      }
      if (category) {
        and.push({ category })
      }
      where.AND = and
    }

    const medicines = await db.medicineInventory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, medicines })
  } catch (error) {
    console.error('Store medicines GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper: get userId from header or body
function getUserId(request: NextRequest, body: Record<string, unknown>): string | null {
  return body.userId as string || request.headers.get('X-User-Id')
}

// POST: Add a medicine
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, genericName, manufacturer, category, price, originalPrice, stockQuantity, description } = body
    const userId = getUserId(request, body)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!name || price === undefined || originalPrice === undefined || stockQuantity === undefined) {
      return NextResponse.json(
        { error: 'Name, price, originalPrice, and stockQuantity are required' },
        { status: 400 }
      )
    }

    const store = await getStoreForOwner(userId)

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found for this user' },
        { status: 401 }
      )
    }

    // Auto-calculate discount
    const discount =
      originalPrice > 0
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0

    // Auto-calculate inStock
    const inStock = stockQuantity > 0

    const medicine = await db.medicineInventory.create({
      data: {
        storeId: store.id,
        name,
        genericName: genericName || '',
        manufacturer: manufacturer || '',
        category: category || 'general',
        price: Number(price),
        originalPrice: Number(originalPrice),
        discount,
        stockQuantity: Number(stockQuantity),
        inStock,
        description: description || null,
      },
    })

    return NextResponse.json({ success: true, medicine })
  } catch (error) {
    console.error('Store medicines POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update a medicine
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { medicineId, ...fields } = body
    const userId = getUserId(request, body)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!medicineId) {
      return NextResponse.json(
        { error: 'Medicine ID is required' },
        { status: 400 }
      )
    }

    const store = await getStoreForOwner(userId)

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found for this user' },
        { status: 401 }
      )
    }

    // Verify the medicine belongs to this store
    const existing = await db.medicineInventory.findFirst({
      where: { id: medicineId, storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Medicine not found or does not belong to your store' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (fields.name !== undefined) updateData.name = fields.name
    if (fields.genericName !== undefined) updateData.genericName = fields.genericName
    if (fields.manufacturer !== undefined) updateData.manufacturer = fields.manufacturer
    if (fields.category !== undefined) updateData.category = fields.category
    if (fields.description !== undefined) updateData.description = fields.description

    // Handle price fields with auto-calculations
    const hasPrice = fields.price !== undefined
    const hasOriginalPrice = fields.originalPrice !== undefined
    const hasStock = fields.stockQuantity !== undefined

    if (hasPrice) updateData.price = Number(fields.price)
    if (hasOriginalPrice) updateData.originalPrice = Number(fields.originalPrice)

    // Recalculate discount if either price changed
    if (hasPrice || hasOriginalPrice) {
      const p = hasPrice ? Number(fields.price) : existing.price
      const op = hasOriginalPrice ? Number(fields.originalPrice) : existing.originalPrice
      updateData.discount = op > 0 ? Math.round(((op - p) / op) * 100) : 0
    }

    if (hasStock) {
      const sq = Number(fields.stockQuantity)
      updateData.stockQuantity = sq
      updateData.inStock = sq > 0
    }

    const medicine = await db.medicineInventory.update({
      where: { id: medicineId },
      data: updateData,
    })

    return NextResponse.json({ success: true, medicine })
  } catch (error) {
    console.error('Store medicines PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a medicine
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { medicineId } = body
    const userId = getUserId(request, body)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!medicineId) {
      return NextResponse.json(
        { error: 'Medicine ID is required' },
        { status: 400 }
      )
    }

    const store = await getStoreForOwner(userId)

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found for this user' },
        { status: 401 }
      )
    }

    // Verify the medicine belongs to this store
    const existing = await db.medicineInventory.findFirst({
      where: { id: medicineId, storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Medicine not found or does not belong to your store' },
        { status: 404 }
      )
    }

    await db.medicineInventory.delete({
      where: { id: medicineId },
    })

    return NextResponse.json({ success: true, message: 'Medicine deleted successfully' })
  } catch (error) {
    console.error('Store medicines DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}