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
    const { action, calculationIds, data } = body

    if (!action || !calculationIds || !Array.isArray(calculationIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Check permissions for bulk operations
    if (session.user.role === 'WAJIB_PAJAK') {
      // Regular users can only bulk delete their own calculations
      if (action === 'DELETE') {
        const userCalculations = await db.taxCalculation.findMany({
          where: {
            id: { in: calculationIds },
            userId: session.user.id
          }
        })

        if (userCalculations.length !== calculationIds.length) {
          return NextResponse.json(
            { error: 'Some calculations do not belong to you' },
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
            { error: 'Only admins can bulk delete calculations' },
            { status: 403 }
          )
        }

        await db.taxCalculation.deleteMany({
          where: {
            id: { in: calculationIds }
          }
        })

        return NextResponse.json({
          message: `Successfully deleted ${calculationIds.length} tax calculations`
        })

      case 'UPDATE_STATUS':
        // Only admins and tax officers can bulk update status
        if (!['ADMIN', 'TAX_OFFICER'].includes(session.user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }

        if (!data || !data.status) {
          return NextResponse.json(
            { error: 'Status is required for bulk update' },
            { status: 400 }
          )
        }

        const updateData: any = {
          status: data.status,
          updatedAt: new Date()
        }

        if (data.status === 'VERIFIED') {
          updateData.verifiedAt = new Date()
        }

        const updatedCalculations = await db.taxCalculation.updateMany({
          where: {
            id: { in: calculationIds }
          },
          data: updateData
        })

        return NextResponse.json({
          message: `Successfully updated status for ${updatedCalculations.count} tax calculations`,
          updatedCount: updatedCalculations.count
        })

      case 'EXPORT':
        // All authenticated users can export their accessible calculations
        const calculations = await db.taxCalculation.findMany({
          where: {
            id: { in: calculationIds },
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
        const exportData = calculations.map(calc => ({
          ID: calc.id,
          'Jenis Pajak': calc.taxType,
          'Tipe Perhitungan': calc.calculationType,
          Periode: calc.period,
          Tahun: calc.year,
          'Penghasilan Kotor': calc.grossIncome,
          'Penghasilan Kena Pajak': calc.taxableIncome,
          'Tarif Pajak': `${(calc.taxRate * 100).toFixed(2)}%`,
          'Pajak Dihitung': calc.calculatedTax,
          'Jumlah Akhir': calc.finalTaxAmount,
          Status: calc.status,
          'Dibuat Oleh': calc.user.name || calc.user.email,
          'Tanggal Dibuat': calc.createdAt,
          'Diperbarui': calc.updatedAt,
          Catatan: calc.notes || '-'
        }))

        return NextResponse.json({
          data: exportData,
          filename: `tax_calculations_export_${new Date().toISOString().split('T')[0]}.csv`
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in bulk tax calculation operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}