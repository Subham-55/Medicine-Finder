import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Fetch single medicine by ID (for admin)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const medicine = await db.medicineInventory.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    })

    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, medicine })
  } catch (error) {
    console.error('Admin medicine GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update a medicine (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.medicineInventory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.genericName !== undefined) updateData.genericName = body.genericName
    if (body.manufacturer !== undefined) updateData.manufacturer = body.manufacturer
    if (body.category !== undefined) updateData.category = body.category
    if (body.price !== undefined) updateData.price = Number(body.price)
    if (body.originalPrice !== undefined) updateData.originalPrice = Number(body.originalPrice)
    if (body.discount !== undefined) updateData.discount = Number(body.discount)
    if (body.stockQuantity !== undefined) updateData.stockQuantity = Number(body.stockQuantity)
    if (body.inStock !== undefined) updateData.inStock = body.inStock
    if (body.description !== undefined) updateData.description = body.description

    const updated = await db.medicineInventory.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, medicine: updated })
  } catch (error) {
    console.error('Admin medicine PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a medicine (admin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.medicineInventory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    await db.medicineInventory.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Medicine deleted successfully' })
  } catch (error) {
    console.error('Admin medicine DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}