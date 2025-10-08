import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-ID')
    const userRole = request.headers.get('X-User-Role')
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'spt' or 'payment'

    const reminders = []

    if (type === 'spt' || !type) {
      // Get SPT reminders
      const sptReminders = await generateSPTReminders(userId)
      reminders.push(...sptReminders)
    }

    if (type === 'payment' || !type) {
      // Get payment reminders
      const paymentReminders = await generatePaymentReminders(userId)
      reminders.push(...paymentReminders)
    }

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Error generating reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateSPTReminders(userId: string) {
  const reminders = []
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Get upcoming SPT deadlines
  const upcomingSPT = await db.taxReport.findMany({
    where: {
      userId,
      status: { in: ['DRAFT', 'SUBMITTED'] },
      OR: [
        {
          // Monthly SPT (PPN, PPh 21, 23) - due by 20th of next month
          taxType: { in: ['PPN', 'PPH_21', 'PPH_23'] },
          year: currentYear,
          period: {
            lte: currentMonth.toString().padStart(2, '0')
          }
        },
        {
          // Annual SPT - due by March 31st
          taxType: { in: ['PPH_25'] },
          year: currentYear - 1
        }
      ]
    },
    include: {
      user: true
    }
  })

  for (const spt of upcomingSPT) {
    const dueDate = calculateDueDate(spt.taxType, spt.period, spt.year)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue <= 7 && daysUntilDue >= 0) {
      reminders.push({
        id: `SPT_REMINDER_${spt.id}`,
        type: 'REMINDER',
        title: `Jatuh Tempo SPT ${spt.taxType}`,
        message: `SPT ${spt.taxType} periode ${spt.period}/${spt.year} akan jatuh tempo dalam ${daysUntilDue} hari`,
        dueDate,
        daysUntilDue,
        priority: daysUntilDue <= 3 ? 'high' : 'medium',
        category: 'spt',
        referenceId: spt.id
      })
    }
  }

  return reminders
}

async function generatePaymentReminders(userId: string) {
  const reminders = []
  const now = new Date()

  // Get pending payments
  const pendingPayments = await db.payment.findMany({
    where: {
      userId,
      status: 'PENDING'
    },
    include: {
      taxReport: true
    }
  })

  for (const payment of pendingPayments) {
    const createdDate = new Date(payment.createdAt)
    const daysPending = Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysPending >= 1) {
      reminders.push({
        id: `PAYMENT_REMINDER_${payment.id}`,
        type: 'REMINDER',
        title: 'Pembayaran Tertunda',
        message: `Pembayaran sebesar Rp${payment.amount.toLocaleString('id-ID')} telah tertunda selama ${daysPending} hari`,
        createdDate,
        daysPending,
        priority: daysPending >= 3 ? 'high' : 'medium',
        category: 'payment',
        referenceId: payment.id
      })
    }
  }

  return reminders
}

function calculateDueDate(taxType: string, period: string, year: number): Date {
  const dueDate = new Date()

  switch (taxType) {
    case 'PPN':
    case 'PPH_21':
    case 'PPH_23':
      // Monthly taxes due by 20th of next month
      const month = parseInt(period)
      dueDate.setFullYear(year, month, 20) // month is 0-indexed in JS
      break
    
    case 'PPH_25':
      // Annual tax due by March 31st
      dueDate.setFullYear(year + 1, 2, 31) // March is month 2
      break
    
    default:
      // Default to 30 days from now
      dueDate.setDate(dueDate.getDate() + 30)
  }

  return dueDate
}