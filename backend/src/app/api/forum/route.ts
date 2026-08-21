import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List forum posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    const [posts, total] = await Promise.all([
      db.forumPost.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      db.forumPost.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Forum GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch forum posts' }, { status: 500 })
  }
}

// POST: Create forum post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, content, category, tags } = body

    if (!userId || !title || !content) {
      return NextResponse.json({ error: 'userId, title, and content are required' }, { status: 400 })
    }

    const post = await db.forumPost.create({
      data: {
        userId,
        title,
        content,
        category: category || 'general',
        tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Forum POST error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

// PUT: Update forum post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, title, content } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    const existing = await db.forumPost.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const data: Record<string, string> = {}
    if (title) data.title = title
    if (content) data.content = content

    const post = await db.forumPost.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Forum PUT error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE: Delete forum post
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    const existing = await db.forumPost.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    await db.forumPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forum DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}