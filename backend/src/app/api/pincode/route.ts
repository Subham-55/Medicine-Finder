import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Pin code lookup and search
// ?pin=110001           → lookup by exact PIN code
// ?search=kolkata       → search by post office name or PIN code prefix
// ?state=WEST BENGAL    → get all pincodes for a state (limited)
// ?states=true          → get list of all states
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pin = searchParams.get('pin')
    const search = searchParams.get('search')
    const state = searchParams.get('state')
    const states = searchParams.get('states')

    // List all states
    if (states === 'true') {
      const rows = await db.$queryRawUnsafe<{ state: string; cnt: number }[]>(
        'SELECT state, COUNT(*) as cnt FROM Pincode GROUP BY state ORDER BY state ASC'
      )
      const result = rows.map((r) => ({ state: r.state, count: Number(r.cnt) }))
      return NextResponse.json({ success: true, states: result })
    }

    // Get pincodes by state (for cascading)
    if (state) {
      const results = await db.$queryRawUnsafe<{ id: string; name: string; pincode: string; state: string }[]>(
        'SELECT id, name, pincode, state FROM Pincode WHERE state = ? ORDER BY pincode ASC LIMIT 100',
        state
      )
      return NextResponse.json({ success: true, results, total: results.length })
    }

    // Search by pin code
    if (pin) {
      const trimmed = pin.trim()
      if (!/^\d{6}$/.test(trimmed)) {
        return NextResponse.json(
          { error: 'PIN code must be exactly 6 digits', found: false },
          { status: 400 }
        )
      }
      const results = await db.$queryRawUnsafe<{ id: string; name: string; pincode: string; state: string }[]>(
        'SELECT id, name, pincode, state FROM Pincode WHERE pincode = ? LIMIT 20',
        trimmed
      )
      if (results.length === 0) {
        return NextResponse.json(
          { error: 'No location found for this PIN code', found: false },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, results })
    }

    // Search by name or pincode prefix
    if (search) {
      const q = search.trim()
      if (!q) {
        return NextResponse.json({ error: 'Search query is empty' }, { status: 400 })
      }
      const results = await db.$queryRawUnsafe<{ id: string; name: string; pincode: string; state: string }[]>(
        'SELECT id, name, pincode, state FROM Pincode WHERE name LIKE ? OR pincode LIKE ? ORDER BY pincode ASC LIMIT 30',
        `%${q}%`,
        `${q}%`
      )
      return NextResponse.json({ success: true, results })
    }

    return NextResponse.json(
      { error: 'Provide "pin", "search", "state", or "states=true" query parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Pincode GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}