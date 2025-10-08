import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-ID')
    const userRole = request.headers.get('X-User-Role')
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const bankName = searchParams.get('bankName')
    const status = searchParams.get('status')
    const accountType = searchParams.get('accountType')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {}
    
    // Filter based on user role
    if (userRole === 'WAJIB_PAJAK') {
      where.userId = userId
    }

    if (bankName) where.bankName = { contains: bankName, mode: 'insensitive' }
    if (status) where.status = status
    if (accountType) where.accountType = accountType
    if (isActive !== null) where.isActive = isActive === 'true'
    
    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { accountName: { contains: search, mode: 'insensitive' } },
        { bankName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [integrations, total] = await Promise.all([
      db.bankIntegration.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.bankIntegration.count({ where })
    ])

    return NextResponse.json({
      integrations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching bank integrations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-ID')
    const userRole = request.headers.get('X-User-Role')
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      bankName,
      accountNumber,
      accountName,
      bankCode,
      branch,
      accountType,
      currency,
      notes
    } = body

    // Validate required fields
    if (!bankName || !accountNumber || !accountName || !accountType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if account number already exists for this user
    const existingAccount = await db.bankIntegration.findFirst({
      where: {
        userId: userId,
        accountNumber: accountNumber
      }
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account number already exists' },
        { status: 400 }
      )
    }

    // If this is the first account, make it primary
    const accountCount = await db.bankIntegration.count({
      where: { userId: userId }
    })

    const isPrimary = accountCount === 0

    const bankIntegration = await db.bankIntegration.create({
      data: {
        userId: userId,
        bankName,
        accountNumber,
        accountName,
        bankCode,
        branch,
        accountType,
        currency: currency || 'IDR',
        isPrimary,
        notes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(bankIntegration, { status: 201 })
  } catch (error) {
    console.error('Error creating bank integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}