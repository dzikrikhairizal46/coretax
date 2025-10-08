import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Severity, ItemStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if audit exists and user has access
    const audit = await db.audit.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    if (session.user.role === 'WAJIB_PAJAK' && audit.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const auditItems = await db.auditItem.findMany({
      where: { auditId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(auditItems)
  } catch (error) {
    console.error('Error fetching audit items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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
      category,
      title,
      description,
      severity,
      finding,
      recommendation,
      evidence,
      dueDate,
      notes
    } = body

    // Check if audit exists and user has access
    const audit = await db.audit.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    if (session.user.role === 'WAJIB_PAJAK' && audit.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate required fields
    if (!category || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create audit item
    const auditItem = await db.auditItem.create({
      data: {
        auditId: params.id,
        category,
        title,
        description,
        severity: (severity as Severity) || Severity.LOW,
        status: ItemStatus.OPEN,
        finding,
        recommendation,
        evidence,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes
      }
    })

    return NextResponse.json(auditItem, { status: 201 })
  } catch (error) {
    console.error('Error creating audit item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}