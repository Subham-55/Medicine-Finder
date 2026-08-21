import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { medicineName, age, weight, gender, patientType } = await request.json()

    if (!medicineName || !age || !weight) {
      return NextResponse.json(
        { error: 'medicineName, age, and weight are required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are a clinical dosage calculation AI assistant. You help calculate appropriate medicine dosages based on patient characteristics. You follow standard clinical guidelines.

When given medicine details and patient info, you must provide dosage recommendations. You MUST respond in valid JSON format with this exact structure:
{
  "medicineName": "Name of the medicine",
  "recommendedDose": "e.g. 500mg twice daily",
  "frequency": "e.g. Twice daily, Three times daily, Once daily",
  "maxDailyDose": "Maximum safe daily dose",
  "duration": "Typical duration of treatment",
  "notes": "Additional relevant notes about this dosage",
  "warnings": ["Warning 1 if applicable", "Warning 2"],
  "disclaimer": "This dosage information is for reference only. Always follow your doctor's prescription and consult a healthcare professional before taking any medication."
}

Consider patient type (adult, pediatric, elderly) and adjust dosages accordingly. For pediatric patients, weight-based dosing is especially important. For elderly patients, consider reduced renal/hepatic function. Only return valid JSON.`

    const patientInfo = [
      `Medicine: ${medicineName}`,
      `Age: ${age}`,
      `Weight: ${weight}kg`,
      gender ? `Gender: ${gender}` : '',
      patientType ? `Patient type: ${patientType}` : '',
    ].filter(Boolean).join(', ')

    const userMessage = `Calculate the appropriate dosage for: ${patientInfo}. Provide recommended dose, frequency, maximum daily dose, duration, and any relevant warnings or notes.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'Failed to calculate dosage' }, { status: 500 })
    }

    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      result = {
        medicineName,
        recommendedDose: '',
        frequency: '',
        maxDailyDose: '',
        duration: '',
        notes: '',
        warnings: [],
        disclaimer: 'Unable to parse AI response. Please consult a healthcare professional.',
        rawResponse: content,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Dosage calculator error:', error)
    return NextResponse.json({ error: 'Failed to calculate dosage' }, { status: 500 })
  }
}