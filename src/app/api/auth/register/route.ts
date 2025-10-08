import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  npwp: z.string().optional(),
  nik: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Check if NPWP already exists
    if (validatedData.npwp) {
      const existingNpwp = await db.user.findUnique({
        where: { npwp: validatedData.npwp }
      })

      if (existingNpwp) {
        return NextResponse.json(
          { error: 'NPWP already registered' },
          { status: 400 }
        )
      }
    }

    // Check if NIK already exists
    if (validatedData.nik) {
      const existingNik = await db.user.findUnique({
        where: { nik: validatedData.nik }
      })

      if (existingNik) {
        return NextResponse.json(
          { error: 'NIK already registered' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        npwp: validatedData.npwp,
        nik: validatedData.nik,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
        company: validatedData.company,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        npwp: true,
        nik: true,
        phoneNumber: true,
        address: true,
        company: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      }
    })

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user 
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}