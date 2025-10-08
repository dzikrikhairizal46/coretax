import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AuditStatus, ItemStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const audit = await db.audit.findUnique({
      where: { id: params.id },
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
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'WAJIB_PAJAK' && audit.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(audit)
  } catch (error) {
    console.error('Error fetching audit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      title,
      description,
      auditType,
      scope,
      startDate,
      endDate,
      auditorId,
      status,
      riskLevel,
      complianceScore,
      reportUrl,
      notes
    } = body

    const existingAudit = await db.audit.findUnique({
      where: { id: params.id }
    })

    if (!existingAudit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'WAJIB_PAJAK' && existingAudit.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update audit
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (auditType !== undefined) updateData.auditType = auditType
    if (scope !== undefined) updateData.scope = scope
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (auditorId !== undefined) updateData.auditorId = auditorId
    if (status !== undefined) updateData.status = status
    if (riskLevel !== undefined) updateData.riskLevel = riskLevel
    if (complianceScore !== undefined) updateData.complianceScore = complianceScore
    if (reportUrl !== undefined) updateData.reportUrl = reportUrl
    if (notes !== undefined) updateData.notes = notes

    const updatedAudit = await db.audit.update({
      where: { id: params.id },
      data: updateData,
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
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(updatedAudit)
  } catch (error) {
    console.error('Error updating audit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const existingAudit = await db.audit.findUnique({
      where: { id: params.id }
    })

    if (!existingAudit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'WAJIB_PAJAK' && existingAudit.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only allow deletion of planned audits
    if (existingAudit.status !== AuditStatus.PLANNED) {
      return NextResponse.json({ error: 'Cannot delete audit in progress or completed' }, { status: 400 })
    }

    await db.audit.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Audit deleted successfully' })
  } catch (error) {
    console.error('Error deleting audit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}