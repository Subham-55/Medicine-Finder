import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// GET: List replies for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params

    const replies = await db.forumReply.findMany({
      where: { postId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: [
        { isBestAnswer: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(replies)
  } catch (error) {
    console.error('Forum replies GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
  }
}

// POST: Create reply (with AI answer on first reply)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const { userId, content } = await request.json()

    if (!userId || !content) {
      return NextResponse.json({ error: 'userId and content are required' }, { status: 400 })
    }

    // Verify post exists
    const post = await db.forumPost.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create the user's reply
    const reply = await db.forumReply.create({
      data: {
        postId,
        userId,
        content,
        isAI: false,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    // Check if this is the first reply - if so, generate an AI answer
    const replyCount = await db.forumReply.count({ where: { postId } })

    if (replyCount === 1) {
      try {
        const zai = await ZAI.create()

        const systemPrompt = `You are a knowledgeable health and medicine community assistant for the Medicine Finder forum. When someone asks a question in the forum, provide a helpful, informative answer.

Rules:
- Provide accurate health/medicine information
- Be supportive and empathetic
- Always recommend consulting a healthcare professional for specific medical concerns
- Keep your answer well-structured and easy to read
- Do not prescribe medications
- Your answer should be detailed but concise`

        const userMessage = `A forum user asked:\n\nTitle: ${post.title}\n\nContent: ${post.content}\n\nCategory: ${post.category}\n\nPlease provide a helpful, informative answer to this question.`

        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          thinking: { type: 'disabled' },
        })

        const aiContent = completion.choices[0]?.message?.content

        if (aiContent) {
          // Find or create an AI user (use the post author's ID context or a system ID)
          const aiReply = await db.forumReply.create({
            data: {
              postId,
              userId: userId, // Use same userId as placeholder for AI
              content: aiContent,
              isAI: true,
            },
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
          })

          return NextResponse.json({ userReply: reply, aiReply }, { status: 201 })
        }
      } catch (aiError) {
        console.error('AI reply generation error:', aiError)
        // Still return the user reply even if AI fails
      }
    }

    return NextResponse.json({ userReply: reply }, { status: 201 })
  } catch (error) {
    console.error('Forum replies POST error:', error)
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })
  }
}