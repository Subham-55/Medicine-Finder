import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Return all stores with lat/lng and medicine count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const city = searchParams.get('city')
    const hasMedicine = searchParams.get('hasMedicine')

    const where: Record<string, unknown> = {
      isActive: true,
      lat: { not: null },
      lng: { not: null },
    }

    if (city) {
      where.city = { contains: city }
    }

    // If hasMedicine is specified, we'll filter after getting stores
    let stores = await db.store.findMany({
      where,
      include: {
        _count: {
          select: { medicines: true },
        },
        medicines: hasMedicine
          ? {
              where: {
                name: { contains: hasMedicine },
                inStock: true,
              },
              select: { id: true },
            }
          : false,
      },
    })

    // Filter stores that have the requested medicine in stock
    if (hasMedicine) {
      stores = stores.filter(s => s.medicines && (s.medicines as unknown[]).length > 0)
    }

    const result = stores.map(s => ({
      id: s.id,
      name: s.name,
      address: s.address,
      city: s.city,
      state: s.state,
      lat: s.lat,
      lng: s.lng,
      phone: s.phone,
      isOpen: s.isOpen,
      workingHours: s.workingHours,
      medicineCount: s._count.medicines,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Map pharmacies GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch pharmacies' }, { status: 500 })
  }
}