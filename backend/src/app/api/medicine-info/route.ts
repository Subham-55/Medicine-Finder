import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ error: 'Medicine name query (q) is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are a comprehensive pharmaceutical encyclopedia AI assistant. You provide detailed, accurate information about medicines including their uses, side effects, contraindications, and safety profiles.

When given a medicine name, you must provide comprehensive information. You MUST respond in valid JSON format with this exact structure:
{
  "name": "Brand/Given name of the medicine",
  "genericName": "Generic/salt composition name",
  "category": "e.g. Antibiotic, Pain Relief, Antihypertensive, etc.",
  "uses": "List of medical conditions it treats",
  "sideEffects": ["Common side effect 1", "Common side effect 2", "Rare side effect"],
  "contraindications": ["Condition or situation where this medicine should not be used"],
  "pregnancySafety": "Safety category during pregnancy (e.g. Category A, B, C, D, X, or 'Consult doctor')",
  "mechanism": "Brief explanation of how the medicine works in the body",
  "manufacturers": ["Known manufacturer 1", "Known manufacturer 2"],
  "commonDosages": ["500mg tablet", "250mg capsule", etc.],
  "disclaimer": "This information is for educational purposes only. Always consult a qualified healthcare professional before using any medication."
}

Only return valid JSON. Do not include any text before or after the JSON.`

    const userMessage = `Provide comprehensive encyclopedia information about the medicine: "${q.trim()}". Include all details about its uses, side effects, contraindications, pregnancy safety, mechanism of action, manufacturers, and common dosages available in India.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'Failed to get medicine information' }, { status: 500 })
    }

    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      result = {
        name: q.trim(),
        genericName: '',
        category: '',
        uses: '',
        sideEffects: [],
        contraindications: [],
        pregnancySafety: '',
        mechanism: '',
        manufacturers: [],
        commonDosages: [],
        disclaimer: 'Unable to parse AI response. Please consult a healthcare professional.',
        rawResponse: content,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Medicine info error:', error)
    return NextResponse.json({ error: 'Failed to get medicine information' }, { status: 500 })
  }
}