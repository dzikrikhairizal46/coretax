import { NextRequest, NextResponse } from 'next/server'
import { optimizedDb } from '@/lib/db-optimized'

export async function GET(request: NextRequest) {
  try {
    // Get user info from headers
    const userId = request.headers.get('X-User-ID')
    const userRole = request.headers.get('X-User-Role')
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await optimizedDb.getDashboardStats(userId, userRole)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}