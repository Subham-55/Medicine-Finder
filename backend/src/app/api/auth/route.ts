import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password } = body

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        )
      }

      const hashedPassword = crypto
        .createHash('sha256')
        .update(password)
        .digest('hex')

      const user = await db.user.findFirst({
        where: { email: email.toLowerCase().trim() },
      })

      if (!user || user.password !== hashedPassword) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      if (user.role === 'customer') {
        return NextResponse.json(
          { error: 'Customers cannot log in through this endpoint' },
          { status: 403 }
        )
      }

      if (user.role === 'admin') {
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
          },
        })
      }

      if (user.role === 'store_owner') {
        const store = await db.store.findUnique({
          where: { ownerId: user.id },
        })

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
          },
          store: store
            ? {
                id: store.id,
                name: store.name,
                address: store.address,
                city: store.city,
                state: store.state,
                country: store.country,
                phone: store.phone,
                isOpen: store.isOpen,
                isActive: store.isActive,
                workingHours: store.workingHours,
              }
            : null,
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}