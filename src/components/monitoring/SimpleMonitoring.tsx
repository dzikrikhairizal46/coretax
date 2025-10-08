'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { fetchWithAuth } from '@/lib/auth-utils'

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  metrics: any
  alerts: any[]
  healthChecks: any[]
}

export default function SimpleMonitoring() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSystemStatus = async () => {
    try {
      const response = await fetchWithAuth('/api/monitoring?type=status')
      const data = await response.json()
      setSystemStatus(data)
    } catch (error) {
      console.error('Error fetching system status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system status...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system monitoring and alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={systemStatus?.status === 'healthy' ? 'default' : 'destructive'}>
            {getStatusIcon(systemStatus?.status || 'unknown')}
            <span className="ml-2 capitalize">{systemStatus?.status || 'unknown'}</span>
          </Badge>
          <Button onClick={fetchSystemStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getStatusIcon(systemStatus?.status || 'unknown')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {systemStatus?.status || 'unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus?.alerts?.length || 0} active alerts
            </p>
          </CardContent>
        </Card>

        {systemStatus?.metrics && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus.metrics.cpu.usage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Load: {systemStatus.metrics.cpu.loadAverage[0].toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus.metrics.memory.percentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(systemStatus.metrics.memory.used / 1024 / 1024)}MB used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus.metrics.database.connections}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active connections
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {systemStatus?.alerts && systemStatus.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>
              Latest system alerts and warnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStatus.alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={alert.type === 'CRITICAL' ? 'destructive' : 'secondary'}>
                    {alert.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {systemStatus?.healthChecks && (
        <Card>
          <CardHeader>
            <CardTitle>Service Health</CardTitle>
            <CardDescription>
              Health status of system services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemStatus.healthChecks.map((health) => (
                <div key={health.service} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {health.service.replace('-', ' ')}
                    </span>
                    {getStatusIcon(health.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Response: {health.responseTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: <span className="capitalize">{health.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { SimpleMonitoring }