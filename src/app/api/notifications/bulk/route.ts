import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationIds } = body

    if (!action || !notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'mark_read':
        result = await db.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id
          },
          data: { isRead: true }
        })
        break

      case 'mark_unread':
        result = await db.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id
          },
          data: { isRead: false }
        })
        break

      case 'delete':
        result = await db.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id
          }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      affected: result.count
    })
  } catch (error) {
    console.error('Error performing bulk notification operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}