import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TAX_OFFICER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profileId, action, notes } = body

    if (!profileId || !action) {
      return NextResponse.json({ error: 'Profile ID and action are required' }, { status: 400 })
    }

    const profile = await db.userProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let updatedProfile
    const now = new Date()

    switch (action) {
      case 'verify':
        updatedProfile = await db.userProfile.update({
          where: { id: profileId },
          data: {
            status: 'ACTIVE',
            isVerified: true,
            verifiedAt: now
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
        break

      case 'reject':
        updatedProfile = await db.userProfile.update({
          where: { id: profileId },
          data: {
            status: 'SUSPENDED',
            isVerified: false
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
        break

      case 'suspend':
        updatedProfile = await db.userProfile.update({
          where: { id: profileId },
          data: {
            status: 'SUSPENDED'
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
        break

      case 'activate':
        updatedProfile = await db.userProfile.update({
          where: { id: profileId },
          data: {
            status: 'ACTIVE'
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
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Create notification for profile owner
    if (action === 'verify') {
      await db.notification.create({
        data: {
          userId: profile.userId,
          title: 'Profil Terverifikasi',
          message: `Profil pajak Anda telah berhasil diverifikasi oleh ${session.user.role === 'ADMIN' ? 'Administrator' : 'Petugas Pajak'}`,
          type: 'SUCCESS'
        }
      })
    } else if (action === 'reject') {
      await db.notification.create({
        data: {
          userId: profile.userId,
          title: 'Profil Ditolak',
          message: `Profil pajak Anda ditolak. ${notes ? 'Alasan: ' + notes : ''}`,
          type: 'ERROR'
        }
      })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error verifying profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}