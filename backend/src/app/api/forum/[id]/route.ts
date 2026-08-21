import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Get single post with all replies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await db.forumPost.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: [
            { isBestAnswer: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Forum post GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}