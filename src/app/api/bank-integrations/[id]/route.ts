import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integration = await db.bankIntegration.findUnique({
      where: { id: params.id },
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

    if (!integration) {
      return NextResponse.json(
        { error: 'Bank integration not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (session.user.role === 'WAJIB_PAJAK' && integration.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(integration)
  } catch (error) {
    console.error('Error fetching bank integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
      bankName,
      accountNumber,
      accountName,
      bankCode,
      branch,
      accountType,
      currency,
      isActive,
      isPrimary,
      status,
      notes
    } = body

    const existingIntegration = await db.bankIntegration.findUnique({
      where: { id: params.id }
    })

    if (!existingIntegration) {
      return NextResponse.json(
        { error: 'Bank integration not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (session.user.role === 'WAJIB_PAJAK' && existingIntegration.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If setting as primary, unset other primary accounts for this user
    if (isPrimary) {
      await db.bankIntegration.updateMany({
        where: {
          userId: existingIntegration.userId,
          id: { not: params.id }
        },
        data: { isPrimary: false }
      })
    }

    // Check if account number already exists (if changing account number)
    if (accountNumber && accountNumber !== existingIntegration.accountNumber) {
      const existingAccount = await db.bankIntegration.findFirst({
        where: {
          userId: existingIntegration.userId,
          accountNumber: accountNumber,
          id: { not: params.id }
        }
      })

      if (existingAccount) {
        return NextResponse.json(
          { error: 'Account number already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = { updatedAt: new Date() }
    
    if (bankName !== undefined) updateData.bankName = bankName
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber
    if (accountName !== undefined) updateData.accountName = accountName
    if (bankCode !== undefined) updateData.bankCode = bankCode
    if (branch !== undefined) updateData.branch = branch
    if (accountType !== undefined) updateData.accountType = accountType
    if (currency !== undefined) updateData.currency = currency
    if (isActive !== undefined) updateData.isActive = isActive
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const updatedIntegration = await db.bankIntegration.update({
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
        }
      }
    })

    return NextResponse.json(updatedIntegration)
  } catch (error) {
    console.error('Error updating bank integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    const existingIntegration = await db.bankIntegration.findUnique({
      where: { id: params.id }
    })

    if (!existingIntegration) {
      return NextResponse.json(
        { error: 'Bank integration not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (session.user.role === 'WAJIB_PAJAK' && existingIntegration.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only admins can delete integrations
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    await db.bankIntegration.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Bank integration deleted successfully' })
  } catch (error) {
    console.error('Error deleting bank integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}