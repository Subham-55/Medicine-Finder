import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Store analytics for store owner
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

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [
      totalMedicines,
      inStockCount,
      outOfStockCount,
      allMedicines,
      lowStockItems,
      recentAdded,
    ] = await Promise.all([
      db.medicineInventory.count({ where: { storeId: store.id } }),
      db.medicineInventory.count({ where: { storeId: store.id, inStock: true } }),
      db.medicineInventory.count({ where: { storeId: store.id, inStock: false } }),
      db.medicineInventory.findMany({
        where: { storeId: store.id },
        select: { category: true, price: true },
      }),
      db.medicineInventory.findMany({
        where: { storeId: store.id, stockQuantity: { lt: 10 } },
        take: 20,
        orderBy: { stockQuantity: 'asc' },
      }),
      db.medicineInventory.findMany({
        where: {
          storeId: store.id,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    // Calculate categories breakdown
    const categoryMap = new Map<string, number>()
    allMedicines.forEach(m => {
      categoryMap.set(m.category, (categoryMap.get(m.category) || 0) + 1)
    })
    const categories = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count)

    // Calculate average price
    const prices = allMedicines.map(m => m.price)
    const avgPrice = prices.length > 0
      ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
      : 0

    return NextResponse.json({
      totalMedicines,
      inStockCount,
      outOfStockCount,
      categories,
      avgPrice,
      lowStockItems,
      recentAdded,
    })
  } catch (error) {
    console.error('Store analytics GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}