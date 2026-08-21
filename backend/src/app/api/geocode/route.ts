import { NextRequest, NextResponse } from 'next/server'

// GET: Reverse geocode lat/lng → city, state, country using OpenStreetMap Nominatim (free, no API key)
// ?lat=19.076&lng=72.8777
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'lat and lng query parameters are required' },
        { status: 400 }
      )
    }

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json(
        { error: 'Invalid lat/lng values' },
        { status: 400 }
      )
    }

    // Use Nominatim reverse geocoding (free, CORS-enabled)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&zoom=10&addressdetails=1&accept-language=en`
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'MedicineFinder/1.0',
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Geocoding service unavailable' },
        { status: 503 }
      )
    }

    const data = await res.json()

    if (data.error) {
      return NextResponse.json(
        { error: 'Could not determine location' },
        { status: 404 }
      )
    }

    const addr = data.address || {}
    const city =
      addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || ''
    const state = addr.state || ''
    const country = addr.country || ''

    if (!city && !state) {
      return NextResponse.json(
        { error: 'Could not determine city or state' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      location: {
        city: city || state,
        state,
        country: country || 'India',
        lat: latNum,
        lng: lngNum,
        display_name: data.display_name || '',
      },
    })
  } catch (error) {
    console.error('Geocode GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}