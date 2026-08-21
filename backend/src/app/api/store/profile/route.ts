import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Get store profile
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const store = await db.store.findUnique({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: { medicines: true },
        },
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        city: store.city,
        state: store.state,
        country: store.country,
        phone: store.phone,
        lat: store.lat,
        lng: store.lng,
        licenseNumber: store.licenseNumber,
        isOpen: store.isOpen,
        isActive: store.isActive,
        workingHours: store.workingHours,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
        owner: store.owner,
        medicineCount: store._count.medicines,
      },
    })
  } catch (error) {
    console.error('Store profile GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update store profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, workingHours, isOpen } = body
    const userId = (body.userId as string) || request.headers.get('X-User-Id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const existingStore = await db.store.findUnique({
      where: { ownerId: userId },
    })

    if (!existingStore) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (phone !== undefined) updateData.phone = phone
    if (workingHours !== undefined) updateData.workingHours = workingHours
    if (isOpen !== undefined) updateData.isOpen = isOpen

    const store = await db.store.update({
      where: { id: existingStore.id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: { medicines: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        city: store.city,
        state: store.state,
        country: store.country,
        phone: store.phone,
        lat: store.lat,
        lng: store.lng,
        licenseNumber: store.licenseNumber,
        isOpen: store.isOpen,
        isActive: store.isActive,
        workingHours: store.workingHours,
        updatedAt: store.updatedAt,
        owner: store.owner,
        medicineCount: store._count.medicines,
      },
    })
  } catch (error) {
    console.error('Store profile PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}