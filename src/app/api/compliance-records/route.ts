import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { RegulationType, ComplianceStatus, Priority, RiskLevel } from '@prisma/client'

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
    const search = searchParams.get('search') || ''
    const regulationType = searchParams.get('regulationType') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const riskLevel = searchParams.get('riskLevel') || ''
    const userIdParam = searchParams.get('userId') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requirement: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (regulationType) {
      where.regulationType = regulationType as RegulationType
    }

    if (status) {
      where.status = status as ComplianceStatus
    }

    if (priority) {
      where.priority = priority as Priority
    }

    if (riskLevel) {
      where.riskLevel = riskLevel as RiskLevel
    }

    // Role-based filtering
    if (userRole === 'WAJIB_PAJAK') {
      where.userId = userId
    } else if (userIdParam && (userRole === 'ADMIN' || userRole === 'TAX_OFFICER')) {
      where.userId = userIdParam
    }

    const [complianceRecords, total] = await Promise.all([
      db.complianceRecord.findMany({
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
      db.complianceRecord.count({ where })
    ])

    return NextResponse.json({
      complianceRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching compliance records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      regulationType,
      regulationId,
      title,
      description,
      requirement,
      status,
      evidence,
      lastVerified,
      nextReview,
      assignedTo,
      priority,
      riskLevel,
      complianceScore,
      actionPlan,
      implementationDate,
      notes
    } = body

    // Validate required fields
    if (!regulationType || !regulationId || !title || !description || !requirement) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create compliance record
    const complianceRecord = await db.complianceRecord.create({
      data: {
        userId: userRole === 'WAJIB_PAJAK' ? userId : body.userId,
        regulationType: regulationType as RegulationType,
        regulationId,
        title,
        description,
        requirement,
        status: (status as ComplianceStatus) || ComplianceStatus.NOT_COMPLIANT,
        evidence,
        lastVerified: lastVerified ? new Date(lastVerified) : null,
        nextReview: nextReview ? new Date(nextReview) : null,
        assignedTo,
        priority: (priority as Priority) || Priority.MEDIUM,
        riskLevel: (riskLevel as RiskLevel) || RiskLevel.LOW,
        complianceScore,
        actionPlan,
        implementationDate: implementationDate ? new Date(implementationDate) : null,
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

    return NextResponse.json(complianceRecord, { status: 201 })
  } catch (error) {
    console.error('Error creating compliance record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}