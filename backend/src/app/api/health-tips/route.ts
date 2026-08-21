import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List health articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')

    const where: Record<string, unknown> = {}

    if (category) where.category = category
    if (featured === 'true') where.isFeatured = true

    const articles = await db.healthArticle.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Health tips GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch health articles' }, { status: 500 })
  }
}