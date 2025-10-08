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
    const type = searchParams.get('type')
    const isRead = searchParams.get('isRead')

    const skip = (page - 1) * limit

    const where: any = {
      userId: userId
    }

    if (type) {
      where.type = type
    }

    if (isRead !== null) {
      where.isRead = isRead === 'true'
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.notification.count({ where })
    ])

    const unreadCount = await db.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    })

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
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
    const { title, message, type, targetUserId } = body

    // If targetUserId is provided and user is admin/tax officer, create notification for specific user
    if (targetUserId && (userRole === 'ADMIN' || userRole === 'TAX_OFFICER')) {
      const notification = await db.notification.create({
        data: {
          userId: targetUserId,
          title,
          message,
          type: type || 'INFO'
        }
      })

      return NextResponse.json(notification)
    }

    // Otherwise, create notification for current user
    const notification = await db.notification.create({
      data: {
        userId: userId,
        title,
        message,
        type: type || 'INFO'
      }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}