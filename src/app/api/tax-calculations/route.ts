import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { optimizedDb } from '@/lib/db-optimized'
import { withCache, cacheConfig, optimizeQueryParams, optimizeResponse } from '@/lib/api-cache'

// Apply caching middleware
const cachedHandler = withCache(cacheConfig.user)(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = optimizeQueryParams(request)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const taxType = searchParams.get('taxType')
    const status = searchParams.get('status')
    const year = searchParams.get('year')
    const calculationType = searchParams.get('calculationType')
    const search = searchParams.get('search')

    const result = await optimizedDb.getTaxCalculations({
      userId: session.user.role === 'WAJIB_PAJAK' ? session.user.id : undefined,
      taxType,
      status,
      year: year ? parseInt(year) : undefined,
      calculationType,
      search,
      page,
      limit
    })

    return optimizeResponse(NextResponse.json(result))
  } catch (error) {
    console.error('Error fetching tax calculations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export async function GET(request: NextRequest) {
  return cachedHandler(request)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      taxType,
      calculationType,
      period,
      year,
      grossIncome,
      deductibleExpenses = 0,
      taxDeductions = 0,
      taxCredits = 0,
      previousTaxPaid = 0,
      notes = ''
    } = body

    // Validate required fields
    if (!taxType || !calculationType || !period || !year || !grossIncome) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate tax based on tax type and income
    const calculation = calculateTax({
      taxType,
      grossIncome,
      deductibleExpenses: deductibleExpenses || 0,
      taxDeductions: taxDeductions || 0,
      taxCredits: taxCredits || 0,
      previousTaxPaid: previousTaxPaid || 0
    })

    const taxCalculation = await optimizedDb.createTaxCalculation({
      userId: session.user.id,
      taxType,
      calculationType,
      period,
      year: parseInt(year),
      grossIncome,
      deductibleExpenses,
      taxDeductions,
      taxCredits,
      previousTaxPaid,
      taxableIncome: calculation.taxableIncome,
      taxRate: calculation.taxRate,
      calculatedTax: calculation.calculatedTax,
      finalTaxAmount: calculation.finalTaxAmount,
      calculationData: JSON.stringify(calculation.breakdown),
      notes
    })

    // Invalidate cache for this user
    optimizedDb.invalidateCacheForUser(session.user.id)

    return optimizeResponse(NextResponse.json(taxCalculation, { status: 201 }))
  } catch (error) {
    console.error('Error creating tax calculation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Tax calculation logic
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
      // PPh Pasal 21 (Income Tax Article 21) - Progressive rates
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
      // PPN (Value Added Tax) - 11%
      taxRate = 0.11
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'flat',
        rate: 0.11,
        description: 'PPN 11%'
      }
      break

    case 'PPH_23':
      // PPh Pasal 23 - 2% for services, 15% for dividends
      taxRate = 0.02 // Default for services
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'flat',
        rate: 0.02,
        description: 'PPh Pasal 23 2% (jasa)'
      }
      break

    case 'PPH_25':
      // PPh Pasal 25 - Monthly installment of annual tax
      taxRate = 0.25 // Corporate tax rate
      calculatedTax = taxableIncome * taxRate / 12 // Monthly
      breakdown = {
        method: 'monthly_installment',
        annualRate: 0.25,
        description: 'PPh Pasal 25 - Angsuran bulanan'
      }
      break

    case 'PBB':
      // PBB (Land and Building Tax) - 0.5%
      taxRate = 0.005
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'flat',
        rate: 0.005,
        description: 'PBB 0.5%'
      }
      break

    case 'BPHTB':
      // BPHTB (Acquisition Duty of Land and Building Rights) - 5%
      taxRate = 0.05
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'flat',
        rate: 0.05,
        description: 'BPHTB 5%'
      }
      break

    case 'PAJAK_KENDARAAN':
      // Vehicle Tax - Progressive rates based on vehicle value
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
      taxRate = 0.10 // Default 10%
      calculatedTax = taxableIncome * taxRate
      breakdown = {
        method: 'default',
        rate: 0.10,
        description: 'Default tax rate 10%'
      }
  }

  // Apply tax deductions
  calculatedTax = Math.max(0, calculatedTax - (taxDeductions || 0))
  
  // Apply tax credits
  calculatedTax = Math.max(0, calculatedTax - (taxCredits || 0))
  
  // Apply previous tax paid
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