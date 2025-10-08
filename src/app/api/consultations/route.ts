import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const userId = searchParams.get('userId') || user.id

    const skip = (page - 1) * limit

    const where: any = {
      OR: [
        { userId: user.id },
        { consultantId: user.id }
      ]
    }

    if (search) {
      where.AND = [
        where.AND || {},
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { response: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    if (category) {
      where.AND = [
        where.AND || {},
        { category: category }
      ]
    }

    if (status) {
      where.AND = [
        where.AND || {},
        { status: status }
      ]
    }

    if (priority) {
      where.AND = [
        where.AND || {},
        { priority: priority }
      ]
    }

    if (userId && user.role === 'ADMIN') {
      where.userId = userId
    }

    const [consultations, total] = await Promise.all([
      db.consultation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          consultant: {
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
      db.consultation.count({ where })
    ])

    return NextResponse.json({
      consultations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching consultations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consultations' },
      { status: 500 }
    )
  }
}

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
    const {
      title,
      description,
      taxType,
      category,
      priority,
      scheduledAt,
      tags,
      isPublic
    } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    const consultation = await db.consultation.create({
      data: {
        userId: user.id,
        title,
        description,
        taxType,
        category,
        priority: priority || 'MEDIUM',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        tags,
        isPublic: isPublic || false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        consultant: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(consultation, { status: 201 })
  } catch (error) {
    console.error('Error creating consultation:', error)
    return NextResponse.json(
      { error: 'Failed to create consultation' },
      { status: 500 }
    )
  }
}