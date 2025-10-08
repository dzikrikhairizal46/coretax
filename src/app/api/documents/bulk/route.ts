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
    const { action, documentIds } = body

    if (!action || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and documentIds are required' },
        { status: 400 }
      )
    }

    // Verify all documents belong to the user
    const documents = await db.document.findMany({
      where: {
        id: { in: documentIds },
        userId: user.id,
        status: { not: 'DELETED' }
      }
    })

    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        { error: 'Some documents not found or access denied' },
        { status: 404 }
      )
    }

    let result

    switch (action) {
      case 'archive':
        result = await db.document.updateMany({
          where: { id: { in: documentIds } },
          data: { status: 'ARCHIVED' }
        })
        break

      case 'restore':
        result = await db.document.updateMany({
          where: { id: { in: documentIds } },
          data: { status: 'ACTIVE' }
        })
        break

      case 'delete':
        result = await db.document.updateMany({
          where: { id: { in: documentIds } },
          data: { status: 'DELETED' }
        })
        break

      case 'setPublic':
        result = await db.document.updateMany({
          where: { id: { in: documentIds } },
          data: { isPublic: true }
        })
        break

      case 'setPrivate':
        result = await db.document.updateMany({
          where: { id: { in: documentIds } },
          data: { isPublic: false }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: `Bulk ${action} completed successfully`,
      count: result.count
    })
  } catch (error) {
    console.error('Error in bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}