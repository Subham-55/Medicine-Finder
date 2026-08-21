import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Store insights for store owner
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

    const allMedicines = await db.medicineInventory.findMany({
      where: { storeId: store.id },
      select: {
        category: true,
        price: true,
        originalPrice: true,
        stockQuantity: true,
        inStock: true,
        discount: true,
      },
    })

    // Top categories by count
    const categoryMap = new Map<string, number>()
    allMedicines.forEach(m => {
      categoryMap.set(m.category, (categoryMap.get(m.category) || 0) + 1)
    })
    const topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Stock summary
    const inStock = allMedicines.filter(m => m.inStock).length
    const outOfStock = allMedicines.filter(m => !m.inStock).length
    const lowStock = allMedicines.filter(m => m.stockQuantity > 0 && m.stockQuantity < 10).length
    const wellStocked = allMedicines.filter(m => m.stockQuantity >= 10).length

    // Price range stats
    const prices = allMedicines.map(m => m.price)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    const avgPrice = prices.length > 0
      ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
      : 0

    // Category distribution (for chart)
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: allMedicines.length > 0
          ? Math.round((count / allMedicines.length) * 100 * 10) / 10
          : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      topCategories,
      stockSummary: {
        total: allMedicines.length,
        inStock,
        outOfStock,
        lowStock,
        wellStocked,
      },
      priceRangeStats: {
        minPrice,
        maxPrice,
        avgPrice,
        priceRange: maxPrice - minPrice,
      },
      categoryDistribution,
    })
  } catch (error) {
    console.error('Store insights GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}