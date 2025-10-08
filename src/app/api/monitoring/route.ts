import { NextRequest, NextResponse } from 'next/server'
import { MonitoringService } from '@/lib/monitoring'

// Initialize monitoring service if not already initialized
if (typeof window === 'undefined') {
  MonitoringService.initialize().catch(console.error)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    switch (type) {
      case 'metrics':
        const metrics = MonitoringService.getCurrentMetrics()
        return NextResponse.json({ metrics })
        
      case 'metrics-history':
        const limit = parseInt(searchParams.get('limit') || '100')
        const metricsHistory = MonitoringService.getMetricsHistory(limit)
        return NextResponse.json({ metrics: metricsHistory })
        
      case 'alerts':
        const alertType = searchParams.get('alertType') as 'WARNING' | 'ERROR' | 'CRITICAL' | undefined
        const resolved = searchParams.get('resolved') === 'true' ? true : 
                        searchParams.get('resolved') === 'false' ? false : undefined
        const alertLimit = parseInt(searchParams.get('limit') || '50')
        const alerts = MonitoringService.getAlerts({ type: alertType, resolved, limit: alertLimit })
        return NextResponse.json({ alerts })
        
      case 'health':
        const healthChecks = MonitoringService.getHealthChecks()
        return NextResponse.json({ healthChecks })
        
      case 'status':
        const status = MonitoringService.getSystemStatus()
        return NextResponse.json(status)
        
      case 'report':
        const report = MonitoringService.generateSystemReport()
        return NextResponse.json(report)
        
      default:
        // Return all data by default
        const currentMetrics = MonitoringService.getCurrentMetrics()
        const allAlerts = MonitoringService.getAlerts({ limit: 20 })
        const allHealthChecks = MonitoringService.getHealthChecks()
        const systemStatus = MonitoringService.getSystemStatus()
        
        return NextResponse.json({
          metrics: currentMetrics,
          alerts: allAlerts,
          healthChecks: allHealthChecks,
          status: systemStatus
        })
    }
  } catch (error) {
    console.error('Error in monitoring API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, alertId } = await request.json()
    
    switch (action) {
      case 'resolve-alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          )
        }
        
        const resolved = MonitoringService.resolveAlert(alertId)
        if (resolved) {
          return NextResponse.json({ success: true, message: 'Alert resolved' })
        } else {
          return NextResponse.json(
            { error: 'Alert not found or already resolved' },
            { status: 404 }
          )
        }
        
      case 'collect-metrics':
        const freshMetrics = await MonitoringService.collectMetrics()
        return NextResponse.json({ 
          success: true, 
          message: 'Metrics collected',
          metrics: freshMetrics 
        })
        
      case 'run-health-checks':
        await MonitoringService.runHealthChecks()
        const healthChecks = MonitoringService.getHealthChecks()
        return NextResponse.json({ 
          success: true, 
          message: 'Health checks completed',
          healthChecks 
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in monitoring API POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}