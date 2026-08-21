import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Store OTPs in memory for demo (in production, use Redis/Firebase)
const otpStore = new Map<string, { otp: string; expiresAt: number; mobile: string }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, mobile, otp, name } = body

    if (action === 'send') {
      if (!mobile || !/^\+?\d{10,15}$/.test(mobile.replace(/\s/g, ''))) {
        return NextResponse.json(
          { error: 'Please enter a valid mobile number' },
          { status: 400 }
        )
      }

      const cleanMobile = mobile.replace(/\s/g, '')
      const otpCode = String(Math.floor(100000 + Math.random() * 900000))
      const expiresAt = Date.now() + 5 * 60 * 1000

      otpStore.set(cleanMobile, { otp: otpCode, expiresAt, mobile: cleanMobile })

      // Log OTP for demo purposes (in production, send via SMS gateway)
      console.log(`[OTP DEMO] Mobile: ${cleanMobile}, OTP: ${otpCode}`)

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        // For demo only - in production, never return OTP
        _demoOtp: otpCode,
      })
    }

    if (action === 'verify') {
      if (!mobile || !otp) {
        return NextResponse.json(
          { error: 'Mobile number and OTP are required' },
          { status: 400 }
        )
      }

      const cleanMobile = mobile.replace(/\s/g, '')
      const stored = otpStore.get(cleanMobile)

      if (!stored) {
        return NextResponse.json(
          { error: 'No OTP found. Please request a new one.' },
          { status: 400 }
        )
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(cleanMobile)
        return NextResponse.json(
          { error: 'OTP has expired. Please request a new one.' },
          { status: 400 }
        )
      }

      if (stored.otp !== otp) {
        return NextResponse.json(
          { error: 'Invalid OTP. Please try again.' },
          { status: 400 }
        )
      }

      otpStore.delete(cleanMobile)

      // Find or create user
      let user = await db.user.findFirst({ where: { mobile: cleanMobile } })

      if (!user) {
        user = await db.user.create({
          data: {
            mobile: cleanMobile,
            name: name || '',
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        user: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          avatar: user.avatar,
          preferredCity: user.preferredCity,
          theme: user.theme,
          notificationsEnabled: user.notificationsEnabled,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}