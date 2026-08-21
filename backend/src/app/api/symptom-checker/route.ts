import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { symptoms, age, gender } = await request.json()

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { error: 'At least one symptom is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are a medical symptom analysis AI assistant. You help users understand possible conditions based on their reported symptoms. You provide general health information but always emphasize consulting a healthcare professional.

When given symptoms, you must:
1. List possible conditions ranked by likelihood (probability as high/medium/low)
2. For each condition, provide a brief description, suggested OTC medicines if applicable, and guidance on when to see a doctor
3. Provide general advice for symptom management

You MUST respond in valid JSON format with this exact structure:
{
  "possibleConditions": [
    {
      "condition": "Condition name",
      "probability": "high|medium|low",
      "description": "Brief description of the condition",
      "recommendedOTC": "Over-the-counter medicine suggestions if applicable, or null",
      "whenToSeeDoctor": "Signs that indicate urgent medical attention is needed"
    }
  ],
  "generalAdvice": "General self-care and symptom management advice",
  "disclaimer": "This symptom analysis is for informational purposes only and does not constitute medical advice. Please consult a qualified healthcare professional for proper diagnosis and treatment. In case of emergency, contact emergency services immediately."
}

List 3-6 most likely conditions. Always include whenToSeeDoctor for each condition. Only return valid JSON.`

    const patientContext = [
      `Symptoms: ${symptoms.join(', ')}`,
      age ? `Age: ${age}` : '',
      gender ? `Gender: ${gender}` : '',
    ].filter(Boolean).join('. ')

    const userMessage = `Analyze these symptoms and provide possible conditions: ${patientContext}. For each condition, include probability, description, recommended OTC medicines if any, and when to see a doctor.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'Failed to analyze symptoms' }, { status: 500 })
    }

    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      result = {
        possibleConditions: [],
        generalAdvice: 'Unable to parse AI response. Please consult a healthcare professional.',
        disclaimer: 'This is for informational purposes only. Please consult a qualified healthcare professional.',
        rawResponse: content,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Symptom checker error:', error)
    return NextResponse.json({ error: 'Failed to analyze symptoms' }, { status: 500 })
  }
}