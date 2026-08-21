import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List reviews for a store
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('storeId')
    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
    }

    const reviews = await db.pharmacyReview.findMany({
      where: { storeId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST: Create review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, storeId, rating, serviceRating, stockRating, staffRating, comment } = body

    if (!userId || !storeId || rating === undefined) {
      return NextResponse.json({ error: 'userId, storeId, and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const review = await db.pharmacyReview.create({
      data: {
        userId,
        storeId,
        rating: Math.round(rating),
        serviceRating: serviceRating ? Math.round(serviceRating) : 0,
        stockRating: stockRating ? Math.round(stockRating) : 0,
        staffRating: staffRating ? Math.round(staffRating) : 0,
        comment: comment || '',
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Reviews POST error:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}

// DELETE: Delete review
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    const existing = await db.pharmacyReview.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await db.pharmacyReview.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reviews DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}