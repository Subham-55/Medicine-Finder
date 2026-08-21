import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Fetch single store with all details and medicines
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const store = await db.store.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
        medicines: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { medicines: true },
        },
      },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Compute medicine stats
    const inStockCount = store.medicines.filter((m) => m.inStock).length
    const outOfStockCount = store.medicines.length - inStockCount
    const avgPrice = store.medicines.length > 0
      ? Math.round(store.medicines.reduce((sum, m) => sum + m.price, 0) / store.medicines.length * 100) / 100
      : 0
    const categories = [...new Set(store.medicines.map((m) => m.category))]

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
        medicines: store.medicines.map((m) => ({
          id: m.id,
          storeId: m.storeId,
          name: m.name,
          genericName: m.genericName,
          manufacturer: m.manufacturer,
          category: m.category,
          price: m.price,
          originalPrice: m.originalPrice,
          discount: m.discount,
          stockQuantity: m.stockQuantity,
          inStock: m.inStock,
          description: m.description,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        })),
        medicineCount: store._count.medicines,
      },
      stats: {
        totalMedicines: store.medicines.length,
        inStock: inStockCount,
        outOfStock: outOfStockCount,
        avgPrice,
        categories,
      },
    })
  } catch (error) {
    console.error('Admin store detail GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update store details (name, address, phone, workingHours, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existingStore = await db.store.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, email: true, isActive: true } } },
    })

    if (!existingStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Build update data for store
    const storeUpdate: Record<string, unknown> = {}
    if (body.name !== undefined) storeUpdate.name = body.name
    if (body.address !== undefined) storeUpdate.address = body.address
    if (body.city !== undefined) storeUpdate.city = body.city
    if (body.state !== undefined) storeUpdate.state = body.state
    if (body.country !== undefined) storeUpdate.country = body.country
    if (body.phone !== undefined) storeUpdate.phone = body.phone
    if (body.workingHours !== undefined) storeUpdate.workingHours = body.workingHours
    if (body.licenseNumber !== undefined) storeUpdate.licenseNumber = body.licenseNumber
    if (body.isOpen !== undefined) storeUpdate.isOpen = body.isOpen
    if (body.isActive !== undefined) storeUpdate.isActive = body.isActive
    if (body.lat !== undefined) storeUpdate.lat = body.lat
    if (body.lng !== undefined) storeUpdate.lng = body.lng

    // Build update data for owner
    const ownerUpdate: Record<string, unknown> = {}
    if (body.ownerName !== undefined) ownerUpdate.name = body.ownerName
    if (body.ownerEmail !== undefined) ownerUpdate.email = body.ownerEmail
    if (body.ownerMobile !== undefined) ownerUpdate.mobile = body.ownerMobile
    if (body.ownerActive !== undefined) ownerUpdate.isActive = body.ownerActive

    // Update store
    const updatedStore = await db.store.update({
      where: { id },
      data: storeUpdate,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            avatar: true,
            isActive: true,
          },
        },
        _count: {
          select: { medicines: true },
        },
      },
    })

    // Update owner if needed
    if (Object.keys(ownerUpdate).length > 0) {
      await db.user.update({
        where: { id: existingStore.owner.id },
        data: ownerUpdate,
      })
      // Re-fetch to get updated owner info
      const refetched = await db.store.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
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
          id: refetched!.id,
          name: refetched!.name,
          address: refetched!.address,
          city: refetched!.city,
          state: refetched!.state,
          country: refetched!.country,
          phone: refetched!.phone,
          isOpen: refetched!.isOpen,
          isActive: refetched!.isActive,
          workingHours: refetched!.workingHours,
          licenseNumber: refetched!.licenseNumber,
          createdAt: refetched!.createdAt,
          updatedAt: refetched!.updatedAt,
          owner: refetched!.owner,
          medicineCount: refetched!._count.medicines,
        },
      })
    }

    return NextResponse.json({
      success: true,
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        address: updatedStore.address,
        city: updatedStore.city,
        state: updatedStore.state,
        country: updatedStore.country,
        phone: updatedStore.phone,
        isOpen: updatedStore.isOpen,
        isActive: updatedStore.isActive,
        workingHours: updatedStore.workingHours,
        licenseNumber: updatedStore.licenseNumber,
        createdAt: updatedStore.createdAt,
        updatedAt: updatedStore.updatedAt,
        owner: updatedStore.owner,
        medicineCount: updatedStore._count.medicines,
      },
    })
  } catch (error) {
    console.error('Admin store detail PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}