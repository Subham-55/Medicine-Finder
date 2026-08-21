import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { medicineName } = await request.json()

    if (!medicineName || typeof medicineName !== 'string' || medicineName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Medicine name is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are a pharmaceutical expert AI assistant specializing in medicine substitutions and generic alternatives. You help users find affordable generic alternatives to expensive branded medicines.

When a user asks about a medicine, you must:
1. Identify the medicine and its generic name (salt composition)
2. List 3-5 affordable generic alternatives available in India
3. For each alternative, provide: name, generic composition, typical price range in INR (₹), and estimated savings percentage vs the brand
4. Include a brief note about the medicine's use

You MUST respond in valid JSON format with this exact structure:
{
  "originalMedicine": {
    "name": "brand name",
    "genericName": "generic/salt name",
    "category": "e.g. Pain Relief, Antibiotic",
    "typicalPrice": "₹XX - ₹XX",
    "uses": "Brief description of what it treats"
  },
  "substitutes": [
    {
      "name": "generic medicine name",
      "manufacturer": "e.g. Cipla, Sun Pharma, Dr. Reddy's",
      "genericComposition": "salt name with strength",
      "priceRange": "₹XX - ₹XX",
      "estimatedSavings": "XX%",
      "inStock": true,
      "note": "Brief note if any"
    }
  ],
  "disclaimer": "Medical disclaimer text"
}

Only return valid JSON. Do not include any text before or after the JSON.`

    const userMessage = `Find affordable generic substitutes for "${medicineName.trim()}". Include the original medicine details and 3-5 cheaper generic alternatives with their prices in Indian Rupees.`

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
        { error: 'Failed to get suggestions from AI' },
        { status: 500 }
      )
    }

    // Try to parse JSON from the response
    let result
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      // If JSON parsing fails, return the raw content
      return NextResponse.json({
        originalMedicine: {
          name: medicineName.trim(),
          genericName: '',
          category: '',
          typicalPrice: '',
          uses: '',
        },
        substitutes: [],
        disclaimer: '',
        rawResponse: content,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Medicine substitutes error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}