import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { medicines } = await request.json()

    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 medicine names are required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are a pharmaceutical expert AI assistant specializing in drug interactions. You analyze combinations of medicines and identify potential interactions, food conflicts, and safety concerns.

When given a list of medicines, you must:
1. Check all pairwise combinations for known drug-drug interactions
2. Identify any food-drug interactions or dietary restrictions
3. Rate each interaction severity as: safe, mild, moderate, or severe
4. Provide clear descriptions and actionable recommendations

You MUST respond in valid JSON format with this exact structure:
{
  "interactions": [
    {
      "pair": "Medicine A + Medicine B",
      "severity": "safe|mild|moderate|severe",
      "description": "Detailed description of the interaction",
      "recommendation": "What the patient should do"
    }
  ],
  "foodConflicts": [
    {
      "medicine": "Medicine name",
      "food": "Food or drink",
      "effect": "Description of the conflict",
      "recommendation": "What to avoid or how to manage"
    }
  ],
  "disclaimer": "This information is for educational purposes only. Always consult your healthcare provider before starting or changing medications."
}

If there are no interactions, return an empty interactions array. If no food conflicts, return an empty foodConflicts array. Only return valid JSON.`

    const userMessage = `Check for drug interactions between these medicines: ${medicines.join(', ')}. For each pair, provide the severity, description, and recommendation. Also identify any food or dietary conflicts for these medicines.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to analyze drug interactions' },
        { status: 500 }
      )
    }

    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      result = {
        interactions: [],
        foodConflicts: [],
        disclaimer: 'Unable to parse AI response. Please consult a healthcare professional.',
        rawResponse: content,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Drug interaction check error:', error)
    return NextResponse.json({ error: 'Failed to check drug interactions' }, { status: 500 })
  }
}