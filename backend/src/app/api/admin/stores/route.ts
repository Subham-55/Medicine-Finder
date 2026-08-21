import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// GET: List all stores with owner info and medicine count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { city: { contains: search } },
            { state: { contains: search } },
            { owner: { name: { contains: search } } },
            { owner: { email: { contains: search } } },
          ],
        }
      : {}

    const stores = await db.store.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isActive: true,
          },
        },
        _count: {
          select: { medicines: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedStores = stores.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      city: store.city,
      state: store.state,
      country: store.country,
      phone: store.phone,
      isOpen: store.isOpen,
      isActive: store.isActive,
      workingHours: store.workingHours,
      licenseNumber: store.licenseNumber,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      owner: store.owner,
      medicineCount: store._count.medicines,
    }))

    return NextResponse.json({ success: true, stores: formattedStores })
  } catch (error) {
    console.error('Admin stores GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new store owner account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      ownerName,
      name,
      email,
      password,
      storeName,
      address,
      city,
      state,
      country,
      phone,
      workingHours,
    } = body

    const ownerNameFinal = ownerName || name
    if (!ownerNameFinal || !email || !password || !storeName || !address || !city || !state || !country || !phone) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex')

    const user = await db.user.create({
      data: {
        name: ownerNameFinal,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'store_owner',
      },
    })

    const store = await db.store.create({
      data: {
        ownerId: user.id,
        name: storeName,
        address,
        city,
        state,
        country,
        phone,
        workingHours: workingHours || '8:00 AM - 10:00 PM',
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isActive: true,
          },
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
        isOpen: store.isOpen,
        isActive: store.isActive,
        workingHours: store.workingHours,
        createdAt: store.createdAt,
        owner: store.owner,
        medicineCount: 0,
      },
    })
  } catch (error) {
    console.error('Admin stores POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update store status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, isActive, isOpen } = body

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    const existingStore = await db.store.findUnique({
      where: { id: storeId },
    })

    if (!existingStore) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    const updateData: { isActive?: boolean; isOpen?: boolean } = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (isOpen !== undefined) updateData.isOpen = isOpen

    const store = await db.store.update({
      where: { id: storeId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isActive: true,
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
        isOpen: store.isOpen,
        isActive: store.isActive,
        workingHours: store.workingHours,
        updatedAt: store.updatedAt,
        owner: store.owner,
        medicineCount: store._count.medicines,
      },
    })
  } catch (error) {
    console.error('Admin stores PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a store and its owner
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId } = body

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    const store = await db.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true, owner: { select: { role: true } } },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    // Deleting the user cascades to store (onDelete: Cascade) and store cascades to medicines
    await db.user.delete({
      where: { id: store.ownerId },
    })

    return NextResponse.json({ success: true, message: 'Store and owner deleted successfully' })
  } catch (error) {
    console.error('Admin stores DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}