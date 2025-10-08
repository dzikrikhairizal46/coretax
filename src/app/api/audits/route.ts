import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuditType, AuditScope, AuditStatus, RiskLevel } from '@prisma/client'

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
    const auditType = searchParams.get('auditType') || ''
    const status = searchParams.get('status') || ''
    const riskLevel = searchParams.get('riskLevel') || ''
    const userIdParam = searchParams.get('userId') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (auditType) {
      where.auditType = auditType as AuditType
    }

    if (status) {
      where.status = status as AuditStatus
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

    const [audits, total] = await Promise.all([
      db.audit.findMany({
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
          auditor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          auditItems: {
            select: {
              id: true,
              status: true,
              severity: true
            }
          },
          _count: {
            select: {
              auditItems: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.audit.count({ where })
    ])

    return NextResponse.json({
      audits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching audits:', error)
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
      title,
      description,
      auditType,
      scope,
      startDate,
      endDate,
      auditorId,
      riskLevel,
      notes
    } = body

    // Validate required fields
    if (!title || !description || !auditType || !scope) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create audit
    const audit = await db.audit.create({
      data: {
        userId: userRole === 'WAJIB_PAJAK' ? userId : body.userId,
        title,
        description,
        auditType: auditType as AuditType,
        scope: scope as AuditScope,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        auditorId,
        riskLevel: (riskLevel as RiskLevel) || RiskLevel.LOW,
        notes,
        status: AuditStatus.PLANNED
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
        auditor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(audit, { status: 201 })
  } catch (error) {
    console.error('Error creating audit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}