import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Return medicine categories with counts from MedicineInventory
export async function GET() {
  try {
    const categories = await db.medicineInventory.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })

    const result = categories.map(c => ({
      category: c.category,
      count: c._count.id,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}