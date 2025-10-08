import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, consultationIds, data } = body

    if (!action || !consultationIds || !Array.isArray(consultationIds)) {
      return NextResponse.json(
        { error: 'Action and consultationIds are required' },
        { status: 400 }
      )
    }

    // Verify user has access to all consultations
    const consultations = await db.consultation.findMany({
      where: {
        id: { in: consultationIds },
        OR: [
          { userId: user.id },
          { consultantId: user.id }
        ]
      }
    })

    if (consultations.length !== consultationIds.length && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied for some consultations' }, { status: 403 })
    }

    let result

    switch (action) {
      case 'assign':
        if (!data?.consultantId) {
          return NextResponse.json({ error: 'Consultant ID is required for assign action' }, { status: 400 })
        }
        result = await db.consultation.updateMany({
          where: { id: { in: consultationIds } },
          data: {
            consultantId: data.consultantId,
            status: 'ASSIGNED',
            updatedAt: new Date()
          }
        })
        break

      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json({ error: 'Status is required for updateStatus action' }, { status: 400 })
        }
        result = await db.consultation.updateMany({
          where: { id: { in: consultationIds } },
          data: {
            status: data.status,
            completedAt: data.status === 'COMPLETED' ? new Date() : null,
            updatedAt: new Date()
          }
        })
        break

      case 'updatePriority':
        if (!data?.priority) {
          return NextResponse.json({ error: 'Priority is required for updatePriority action' }, { status: 400 })
        }
        result = await db.consultation.updateMany({
          where: { id: { in: consultationIds } },
          data: {
            priority: data.priority,
            updatedAt: new Date()
          }
        })
        break

      case 'setPublic':
        result = await db.consultation.updateMany({
          where: { id: { in: consultationIds } },
          data: {
            isPublic: true,
            updatedAt: new Date()
          }
        })
        break

      case 'setPrivate':
        result = await db.consultation.updateMany({
          where: { id: { in: consultationIds } },
          data: {
            isPublic: false,
            updatedAt: new Date()
          }
        })
        break

      case 'schedule':
        if (!data?.scheduledAt) {
          return NextResponse.json({ error: 'Scheduled date is required for schedule action' }, { status: 400 })
        }
        result = await db.consultation.updateMany({
          where: { id: { in: consultationIds } },
          data: {
            scheduledAt: new Date(data.scheduledAt),
            status: 'ASSIGNED',
            updatedAt: new Date()
          }
        })
        break

      case 'delete':
        // Only users who created the consultation or admins can delete
        const userConsultations = await db.consultation.findMany({
          where: {
            id: { in: consultationIds },
            OR: [
              { userId: user.id },
              { consultantId: user.id }
            ]
          }
        })

        const deletableIds = userConsultations.map(c => c.id)
        
        if (user.role === 'ADMIN') {
          // Admins can delete any consultation
          result = await db.consultation.deleteMany({
            where: { id: { in: consultationIds } }
          })
        } else {
          // Other users can only delete consultations they created or are assigned to
          result = await db.consultation.deleteMany({
            where: { id: { in: deletableIds } }
          })
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      message: `Bulk ${action} completed successfully`,
      affectedCount: result.count
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}