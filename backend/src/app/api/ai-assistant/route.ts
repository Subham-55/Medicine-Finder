import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are a helpful health and medicine AI assistant for the Medicine Finder app. Provide accurate, helpful health information but always remind users to consult a healthcare professional for medical advice.

You can help with:
- Medicine information and uses
- General health queries
- Understanding medical terms
- Drug information (but always recommend consulting a doctor)
- Health tips and wellness advice
- Understanding prescriptions and lab reports (general guidance only)
- First aid information
- Nutrition and lifestyle advice

${context ? `Additional context about the user: ${context}` : ''}

Important rules:
- Always be empathetic and supportive
- Never diagnose or prescribe - suggest consulting a doctor
- Provide evidence-based general information
- If unsure, recommend consulting a healthcare professional
- Keep responses concise but informative
- Always include a brief reminder to consult a healthcare professional for medical concerns`

    const chatMessages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const completion = await zai.chat.completions.create({
      messages: chatMessages,
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 })
    }

    return NextResponse.json({ response: content })
  } catch (error) {
    console.error('AI assistant error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}