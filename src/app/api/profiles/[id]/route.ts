import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await db.userProfile.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          { user: { role: { in: ['ADMIN', 'TAX_OFFICER'] } } }
        ]
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

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
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
      country,
      status
    } = body

    // Check if user owns the profile or is admin/tax officer
    const existingProfile = await db.userProfile.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          { user: { role: { in: ['ADMIN', 'TAX_OFFICER'] } } }
        ]
      }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check NPWP uniqueness if updating
    if (npwp && npwp !== existingProfile.npwp) {
      const npwpExists = await db.userProfile.findFirst({
        where: {
          npwp,
          id: { not: params.id }
        }
      })

      if (npwpExists) {
        return NextResponse.json(
          { error: 'NPWP already exists' },
          { status: 400 }
        )
      }
    }

    const profile = await db.userProfile.update({
      where: { id: params.id },
      data: {
        ...(companyName && { companyName }),
        ...(companyType && { companyType }),
        ...(industry && { industry }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(website && { website }),
        ...(description !== undefined && { description }),
        ...(npwp !== undefined && { npwp }),
        ...(nppkp !== undefined && { nppkp }),
        ...(nik !== undefined && { nik }),
        ...(ktpNumber !== undefined && { ktpNumber }),
        ...(pkpNumber !== undefined && { pkpNumber }),
        ...(taxOffice !== undefined && { taxOffice }),
        ...(province !== undefined && { province }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country !== undefined && { country }),
        ...(status !== undefined && { status })
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
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the profile or is admin
    const existingProfile = await db.userProfile.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          { user: { role: 'ADMIN' } }
        ]
      }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await db.userProfile.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}