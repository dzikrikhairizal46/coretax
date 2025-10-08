import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const companyType = searchParams.get('companyType')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {}

    // If user is not admin/tax officer, only show their own profiles
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TAX_OFFICER') {
      where.userId = session.user.id
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        { npwp: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (companyType) {
      where.companyType = companyType
    }

    if (status) {
      where.status = status
    }

    const [profiles, total] = await Promise.all([
      db.userProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.userProfile.count({ where })
    ])

    return NextResponse.json({
      profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      taxType,
      companyName,
      companyType,
      industry,
      address,
      phone,
      email,
      website,
      description,
      npwp,
      nppkp,
      nik,
      ktpNumber,
      pkpNumber,
      taxOffice,
      province,
      city,
      postalCode,
      country
    } = body

    // Check if profile already exists for this user and tax type
    const existingProfile = await db.userProfile.findFirst({
      where: {
        userId: session.user.id,
        taxType
      }
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile for this tax type already exists' },
        { status: 400 }
      )
    }

    // Generate tax ID
    const taxId = generateTaxId(taxType, session.user.id)

    const profile = await db.userProfile.create({
      data: {
        userId: session.user.id,
        taxType,
        taxId,
        companyName,
        companyType,
        industry,
        address,
        phone,
        email,
        website,
        description,
        npwp,
        nppkp,
        nik,
        ktpNumber,
        pkpNumber,
        taxOffice,
        province,
        city,
        postalCode,
        country: country || 'Indonesia'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateTaxId(taxType: string, userId: string): string {
  const timestamp = Date.now().toString().slice(-6)
  const userSuffix = userId.slice(-4)
  const typeCode = {
    PPH_21: '21',
    PPH_23: '23',
    PPH_25: '25',
    PPN: 'PN',
    PBB: 'BB',
    BPHTB: 'HT',
    PAJAK_KENDARAAN: 'KN'
  }[taxType] || 'XX'

  return `TAX${typeCode}${userSuffix}${timestamp}`
}