import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert at reading medical prescriptions. When given an image of a prescription, extract all medicine names mentioned.

You MUST respond in valid JSON format with this exact structure:
{
  "medicines": [
    {
      "name": "medicine name as written on prescription",
      "dosage": "dosage if mentioned (e.g. 500mg, 10mg)",
      "frequency": "how often to take (e.g. twice daily, once daily, SOS)",
      "duration": "duration if mentioned (e.g. 5 days, 1 week)",
      "instructions": "any special instructions (e.g. after food, before bed)"
    }
  ],
  "doctorName": "doctor name if visible",
  "patientName": "patient name if visible",
  "date": "prescription date if visible",
  "notes": "any additional notes on the prescription"
}

Rules:
- Extract ALL medicines mentioned, including those written in shorthand
- If dosage is not specified, use "Not specified"
- If you cannot read a medicine name clearly, still include it with your best guess and mark it as "unclear": true
- Only include actual medicine names, not general instructions
- Return valid JSON only, no additional text`

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all medicine names and details from this medical prescription image. Include dosage, frequency, duration, and any instructions for each medicine.',
            },
            {
              type: 'image_url',
              image_url: {
                url: image.startsWith('data:')
                  ? image
                  : `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to analyze prescription image' },
        { status: 500 }
      )
    }

    // Try to parse JSON from the response
    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      // If JSON parsing fails, try to extract medicine names from raw text
      const lines = content.split('\n').filter(l => l.trim().length > 0)
      return NextResponse.json({
        medicines: lines.slice(0, 10).map(line => ({
          name: line.trim(),
          dosage: 'Not specified',
          frequency: 'Not specified',
          duration: 'Not specified',
          instructions: '',
          unclear: true,
        })),
        doctorName: '',
        patientName: '',
        date: '',
        notes: '',
        rawResponse: content,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Prescription scan error:', error)
    return NextResponse.json(
      { error: 'Failed to process prescription image' },
      { status: 500 }
    )
  }
}