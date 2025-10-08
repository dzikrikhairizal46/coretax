import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, integrationIds, data } = body

    if (!action || !integrationIds || !Array.isArray(integrationIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Check permissions for bulk operations
    if (session.user.role === 'WAJIB_PAJAK') {
      // Regular users can only bulk deactivate their own integrations
      if (action === 'DEACTIVATE') {
        const userIntegrations = await db.bankIntegration.findMany({
          where: {
            id: { in: integrationIds },
            userId: session.user.id
          }
        })

        if (userIntegrations.length !== integrationIds.length) {
          return NextResponse.json(
            { error: 'Some integrations do not belong to you' },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Insufficient permissions for bulk operation' },
          { status: 403 }
        )
      }
    }

    switch (action) {
      case 'DELETE':
        // Only admins can bulk delete
        if (session.user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Only admins can bulk delete integrations' },
            { status: 403 }
          )
        }

        await db.bankIntegration.deleteMany({
          where: {
            id: { in: integrationIds }
          }
        })

        return NextResponse.json({
          message: `Successfully deleted ${integrationIds.length} bank integrations`
        })

      case 'ACTIVATE':
        // Only admins and tax officers can bulk activate
        if (!['ADMIN', 'TAX_OFFICER'].includes(session.user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }

        const activatedIntegrations = await db.bankIntegration.updateMany({
          where: {
            id: { in: integrationIds }
          },
          data: {
            isActive: true,
            status: 'ACTIVE',
            updatedAt: new Date()
          }
        })

        return NextResponse.json({
          message: `Successfully activated ${activatedIntegrations.count} bank integrations`,
          updatedCount: activatedIntegrations.count
        })

      case 'DEACTIVATE':
        // Only admins and tax officers can bulk deactivate
        if (!['ADMIN', 'TAX_OFFICER'].includes(session.user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }

        const deactivatedIntegrations = await db.bankIntegration.updateMany({
          where: {
            id: { in: integrationIds }
          },
          data: {
            isActive: false,
            status: 'INACTIVE',
            updatedAt: new Date()
          }
        })

        return NextResponse.json({
          message: `Successfully deactivated ${deactivatedIntegrations.count} bank integrations`,
          updatedCount: deactivatedIntegrations.count
        })

      case 'SET_PRIMARY':
        // Users can set their own integrations as primary
        if (session.user.role === 'WAJIB_PAJAK') {
          const userIntegrations = await db.bankIntegration.findMany({
            where: {
              id: { in: integrationIds },
              userId: session.user.id
            }
          })

          if (userIntegrations.length !== integrationIds.length) {
            return NextResponse.json(
              { error: 'Some integrations do not belong to you' },
              { status: 403 }
            )
          }
        }

        if (integrationIds.length !== 1) {
          return NextResponse.json(
            { error: 'Only one integration can be set as primary' },
            { status: 400 }
          )
        }

        const [integrationId] = integrationIds
        const integration = await db.bankIntegration.findUnique({
          where: { id: integrationId }
        })

        if (!integration) {
          return NextResponse.json(
            { error: 'Bank integration not found' },
            { status: 404 }
          )
        }

        // Unset other primary accounts
        await db.bankIntegration.updateMany({
          where: {
            userId: integration.userId,
            id: { not: integrationId }
          },
          data: { isPrimary: false }
        })

        // Set selected as primary
        await db.bankIntegration.update({
          where: { id: integrationId },
          data: { isPrimary: true }
        })

        return NextResponse.json({
          message: 'Successfully set bank integration as primary'
        })

      case 'SYNC':
        // Simulate bank synchronization
        if (!['ADMIN', 'TAX_OFFICER'].includes(session.user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }

        const syncedIntegrations = await db.bankIntegration.updateMany({
          where: {
            id: { in: integrationIds }
          },
          data: {
            syncStatus: 'SYNCING',
            lastSyncAt: new Date(),
            updatedAt: new Date()
          }
        })

        // Simulate sync completion (in real implementation, this would be async)
        setTimeout(async () => {
          await db.bankIntegration.updateMany({
            where: {
              id: { in: integrationIds }
            },
            data: {
              syncStatus: 'SYNCED',
              updatedAt: new Date()
            }
          })
        }, 2000)

        return NextResponse.json({
          message: `Sync initiated for ${syncedIntegrations.count} bank integrations`,
          updatedCount: syncedIntegrations.count
        })

      case 'EXPORT':
        // All authenticated users can export their accessible integrations
        const integrations = await db.bankIntegration.findMany({
          where: {
            id: { in: integrationIds },
            ...(session.user.role === 'WAJIB_PAJAK' && { userId: session.user.id })
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

        // Format data for export
        const exportData = integrations.map(integration => ({
          ID: integration.id,
          'Nama Bank': integration.bankName,
          'Nomor Rekening': integration.accountNumber,
          'Nama Pemilik': integration.accountName,
          'Kode Bank': integration.bankCode || '-',
          'Cabang': integration.branch || '-',
          'Tipe Akun': integration.accountType,
          'Mata Uang': integration.currency,
          'Saldo': integration.balance || 0,
          'Status': integration.status,
          'Aktif': integration.isActive ? 'Ya' : 'Tidak',
          'Utama': integration.isPrimary ? 'Ya' : 'Tidak',
          'Sinkronisasi': integration.syncStatus,
          'Terakhir Sinkron': integration.lastSyncAt || '-',
          'Dibuat Oleh': integration.user.name || integration.user.email,
          'Tanggal Dibuat': integration.createdAt,
          'Diperbarui': integration.updatedAt,
          Catatan: integration.notes || '-'
        }))

        return NextResponse.json({
          data: exportData,
          filename: `bank_integrations_export_${new Date().toISOString().split('T')[0]}.csv`
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in bulk bank integration operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}