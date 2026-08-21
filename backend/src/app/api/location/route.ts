import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const locations = await db.savedLocation.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Location GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, label, address, city, state, country, lat, lng, isDefault } = body

    if (!userId || !city || !state || !country) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    if (isDefault) {
      await db.savedLocation.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const location = await db.savedLocation.create({
      data: {
        id: uuidv4(),
        userId,
        label: label || city,
        address: address || '',
        city,
        state,
        country,
        lat: lat || null,
        lng: lng || null,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ success: true, location })
  } catch (error) {
    console.error('Location POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!locationId || !userId) {
      return NextResponse.json({ error: 'Location ID and User ID required' }, { status: 400 })
    }

    await db.savedLocation.delete({
      where: { id: locationId, userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Location DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}