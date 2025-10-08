import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const DEMO_USERS = [
  {
    email: "admin@coretax.id",
    password: "admin123",
    name: "Administrator CoreTax",
    role: "ADMIN",
    npwp: "01.234.567.8-901.000",
    company: "Direktorat Jenderal Pajak",
    phoneNumber: "+6281234567890",
    address: "Jakarta Pusat"
  },
  {
    email: "wajibpajak1@coretax.id",
    password: "wajib123",
    name: "Budi Santoso",
    role: "WAJIB_PAJAK",
    npwp: "02.345.678.9-012.000",
    company: "PT. Maju Bersama",
    phoneNumber: "+6282345678901",
    address: "Jakarta Selatan"
  },
  {
    email: "wajibpajak2@coretax.id",
    password: "wajib123",
    name: "Siti Rahayu",
    role: "WAJIB_PAJAK",
    npwp: "03.456.789.0-123.000",
    company: "CV. Sukses Sejahtera",
    phoneNumber: "+6283456789012",
    address: "Jakarta Barat"
  },
  {
    email: "petugas@coretax.id",
    password: "petugas123",
    name: "Ahmad Wijaya",
    role: "TAX_OFFICER",
    npwp: "04.567.890.1-234.000",
    company: "Kantor Pajak Pratama",
    phoneNumber: "+6284567890123",
    address: "Jakarta Timur"
  },
  {
    email: "konsultan@coretax.id",
    password: "konsultan123",
    name: "Dewi Lestari",
    role: "CONSULTANT",
    npwp: "05.678.901.2-345.000",
    company: "Konsultan Pajak Profesional",
    phoneNumber: "+6285678901234",
    address: "Jakarta Utara"
  }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find demo user
    const demoUser = DEMO_USERS.find(user => user.email === email)
    
    if (!demoUser || demoUser.password !== password) {
      return NextResponse.json(
        { error: 'Invalid demo credentials' },
        { status: 401 }
      )
    }

    // Check if user already exists in database
    const existingUser = await db.user.findUnique({
      where: { email: demoUser.email }
    })

    if (existingUser) {
      // Return existing user
      const { password: _, ...userWithoutPassword } = existingUser
      return NextResponse.json({
        message: 'Demo login successful',
        user: userWithoutPassword
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(demoUser.password, 12)

    // Create new user
    const user = await db.user.create({
      data: {
        email: demoUser.email,
        password: hashedPassword,
        name: demoUser.name,
        role: demoUser.role,
        npwp: demoUser.npwp,
        phoneNumber: demoUser.phoneNumber,
        address: demoUser.address,
        company: demoUser.company,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        npwp: true,
        phoneNumber: true,
        address: true,
        company: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      message: 'Demo user created and logged in successfully',
      user
    })
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return list of demo user emails (without passwords)
    const demoUsersInfo = DEMO_USERS.map(user => ({
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company
    }))

    return NextResponse.json({
      message: 'Demo users available',
      demoUsers: demoUsersInfo
    })
  } catch (error) {
    console.error('Get demo users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}