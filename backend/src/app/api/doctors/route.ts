import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List doctors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const specialty = searchParams.get('specialty')
    const city = searchParams.get('city')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { isActive: true }

    if (specialty) where.specialty = specialty
    if (city) where.city = city
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { specialty: { contains: search } },
        { clinicName: { contains: search } },
      ]
    }

    const doctors = await db.doctor.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(doctors)
  } catch (error) {
    console.error('Doctors GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 })
  }
}

// POST: Create doctor (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, specialty, clinicName, address, city, state,
      lat, lng, phone, availableDays, availableHours, consultationFee,
    } = body

    if (!name || !specialty || !city) {
      return NextResponse.json({ error: 'name, specialty, and city are required' }, { status: 400 })
    }

    const doctor = await db.doctor.create({
      data: {
        name,
        specialty: specialty || 'General Physician',
        clinicName: clinicName || '',
        address: address || '',
        city,
        state: state || '',
        lat: lat || null,
        lng: lng || null,
        phone: phone || '',
        availableDays: Array.isArray(availableDays) ? availableDays.join(',') : (availableDays || 'Mon-Fri'),
        availableHours: availableHours || '9:00 AM - 5:00 PM',
        consultationFee: consultationFee || 0,
        isVerified: true,
      },
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    console.error('Doctors POST error:', error)
    return NextResponse.json({ error: 'Failed to create doctor' }, { status: 500 })
  }
}