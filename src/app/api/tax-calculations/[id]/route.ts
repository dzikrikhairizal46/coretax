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

    const calculation = await db.taxCalculation.findUnique({
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

    if (!calculation) {
      return NextResponse.json(
        { error: 'Tax calculation not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (session.user.role === 'WAJIB_PAJAK' && calculation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(calculation)
  } catch (error) {
    console.error('Error fetching tax calculation:', error)
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
      status,
      notes,
      grossIncome,
      deductibleExpenses,
      taxDeductions,
      taxCredits,
      previousTaxPaid
    } = body

    const existingCalculation = await db.taxCalculation.findUnique({
      where: { id: params.id }
    })

    if (!existingCalculation) {
      return NextResponse.json(
        { error: 'Tax calculation not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (session.user.role === 'WAJIB_PAJAK' && existingCalculation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only admins and tax officers can change status to verified/approved
    if (status && ['VERIFIED', 'APPROVED'].includes(status) && 
        !['ADMIN', 'TAX_OFFICER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    let updateData: any = { updatedAt: new Date() }
    
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    
    // If financial data is updated, recalculate
    if (grossIncome !== undefined || deductibleExpenses !== undefined || 
        taxDeductions !== undefined || taxCredits !== undefined || 
        previousTaxPaid !== undefined) {
      
      const calculationData = {
        taxType: existingCalculation.taxType,
        grossIncome: grossIncome ?? existingCalculation.grossIncome,
        deductibleExpenses: deductibleExpenses ?? existingCalculation.deductibleExpenses,
        taxDeductions: taxDeductions ?? existingCalculation.taxDeductions,
        taxCredits: taxCredits ?? existingCalculation.taxCredits,
        previousTaxPaid: previousTaxPaid ?? existingCalculation.previousTaxPaid
      }

      const newCalculation = calculateTax(calculationData)
      
      updateData = {
        ...updateData,
        grossIncome: calculationData.grossIncome,
        deductibleExpenses: calculationData.deductibleExpenses,
        taxDeductions: calculationData.taxDeductions,
        taxCredits: calculationData.taxCredits,
        previousTaxPaid: calculationData.previousTaxPaid,
        taxableIncome: newCalculation.taxableIncome,
        taxRate: newCalculation.taxRate,
        calculatedTax: newCalculation.calculatedTax,
        finalTaxAmount: newCalculation.finalTaxAmount,
        calculationData: JSON.stringify(newCalculation.breakdown),
        status: 'CALCULATED' // Reset to calculated when data changes
      }
    }

    // Set verified timestamp if status is changed to verified
    if (status === 'VERIFIED') {
      updateData.verifiedAt = new Date()
    }

    const updatedCalculation = await db.taxCalculation.update({
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

    return NextResponse.json(updatedCalculation)
  } catch (error) {
    console.error('Error updating tax calculation:', error)
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

    const existingCalculation = await db.taxCalculation.findUnique({
      where: { id: params.id }
    })

    if (!existingCalculation) {
      return NextResponse.json(
        { error: 'Tax calculation not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (session.user.role === 'WAJIB_PAJAK' && existingCalculation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only admins can delete calculations
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    await db.taxCalculation.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Tax calculation deleted successfully' })
  } catch (error) {
    console.error('Error deleting tax calculation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Tax calculation logic (copied from main route for now)
function calculateTax(data: {
  taxType: string
  grossIncome: number
  deductibleExpenses: number
  taxDeductions: number
  taxCredits: number
  previousTaxPaid: number
}) {
  const { taxType, grossIncome, deductibleExpenses, taxDeductions, taxCredits, previousTaxPaid } = data
  
  let taxableIncome = grossIncome - (deductibleExpenses || 0)
  let taxRate = 0
  let calculatedTax = 0
  let breakdown: any = {}

  switch (taxType) {
    case 'PPH_21':
      if (taxableIncome <= 60000000) {
        taxRate = 0.05
      } else if (taxableIncome <= 250000000) {
        taxRate = 0.15
      } else if (taxableIncome <= 500000000) {
        taxRate = 0.25
      } else if (taxableIncome <= 5000000000) {
        taxRate = 0.30
      } else {
        taxRate = 0.35
      }
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'progressive',
        brackets: [
          { max: 60000000, rate: 0.05 },
          { max: 250000000, rate: 0.15 },
          { max: 500000000, rate: 0.25 },
          { max: 5000000000, rate: 0.30 },
          { above: 5000000000, rate: 0.35 }
        ]
      }
      break

    case 'PPN':
      taxRate = 0.11
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'flat',
        rate: 0.11,
        description: 'PPN 11%'
      }
      break

    case 'PPH_23':
      taxRate = 0.02
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'flat',
        rate: 0.02,
        description: 'PPh Pasal 23 2% (jasa)'
      }
      break

    case 'PPH_25':
      taxRate = 0.25
      calculatedTax = taxableIncome * taxRate / 12
      breakdown = {
        method: 'monthly_installment',
        annualRate: 0.25,
        description: 'PPh Pasal 25 - Angsuran bulanan'
      }
      break

    case 'PBB':
      taxRate = 0.005
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'flat',
        rate: 0.005,
        description: 'PBB 0.5%'
      }
      break

    case 'BPHTB':
      taxRate = 0.05
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'flat',
        rate: 0.05,
        description: 'BPHTB 5%'
      }
      break

    case 'PAJAK_KENDARAAN':
      if (taxableIncome <= 100000000) {
        taxRate = 0.01
      } else if (taxableIncome <= 250000000) {
        taxRate = 0.015
      } else if (taxableIncome <= 500000000) {
        taxRate = 0.02
      } else {
        taxRate = 0.025
      }
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'progressive',
        brackets: [
          { max: 100000000, rate: 0.01 },
          { max: 250000000, rate: 0.015 },
          { max: 500000000, rate: 0.02 },
          { above: 500000000, rate: 0.025 }
        ]
      }
      break

    default:
      taxRate = 0.10
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'default',
        rate: 0.10,
        description: 'Default tax rate 10%'
      }
  }

  calculatedTax = Math.max(0, calculatedTax - (taxDeductions || 0))
  calculatedTax = Math.max(0, calculatedTax - (taxCredits || 0))
  const finalTaxAmount = Math.max(0, calculatedTax - (previousTaxPaid || 0))

  return {
    taxableIncome,
    taxRate,
    calculatedTax,
    finalTaxAmount,
    breakdown: {
      ...breakdown,
      grossIncome,
      deductibleExpenses,
      taxDeductions,
      taxCredits,
      previousTaxPaid,
      calculatedTaxBeforeDeductions: calculatedTax + (taxDeductions || 0) + (taxCredits || 0),
      finalTaxAmount
    }
  }
}