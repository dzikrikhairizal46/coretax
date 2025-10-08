'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  HardDrive,
  Database,
  Wifi,
  Clock
} from 'lucide-react'

interface SystemMetrics {
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    incoming: number
    outgoing: number
  }
  database: {
    connections: number
    queryTime: {
      average: number
      max: number
    }
  }
  uptime: number
  timestamp: string
}

interface AlertData {
  id: string
  type: 'WARNING' | 'ERROR' | 'CRITICAL'
  message: string
  description: string
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  metadata?: Record<string, any>
}

interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  lastChecked: string
  details?: Record<string, any>
}

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  metrics: SystemMetrics | null
  alerts: AlertData[]
  healthChecks: HealthCheck[]
}

export default function SystemMonitoringDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/monitoring?type=status')
      const data = await response.json()
      setSystemStatus(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching system status:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve-alert', alertId })
      })
      
      if (response.ok) {
        await fetchSystemStatus()
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const refreshMetrics = async () => {
    try {
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'collect-metrics' })
      })
      await fetchSystemStatus()
    } catch (error) {
      console.error('Error refreshing metrics:', error)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'unhealthy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'WARNING': return 'border-yellow-500 bg-yellow-50'
      case 'ERROR': return 'border-orange-500 bg-orange-50'
      case 'CRITICAL': return 'border-red-500 bg-red-50'
      default: return 'border-gray-500 bg-gray-50'
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

  if (!systemStatus) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load system monitoring data. Please check your connection.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={systemStatus.status === 'healthy' ? 'default' : 'destructive'}>
            {getStatusIcon(systemStatus.status)}
            <span className="ml-2 capitalize">{systemStatus.status}</span>
          </Badge>
          <Button onClick={refreshMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({systemStatus.alerts.length})</TabsTrigger>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                {getStatusIcon(systemStatus.status)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{systemStatus.status}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.alerts.length} active alerts
                </p>
              </CardContent>
            </Card>

            {systemStatus.metrics && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
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
                      {formatBytes(systemStatus.metrics.memory.used)} used
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatUptime(systemStatus.metrics.uptime)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Since system start
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {systemStatus.alerts.length > 0 && (
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
                    <Alert key={alert.id} className={getAlertColor(alert.type)}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {systemStatus.metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cpu className="h-5 w-5 mr-2" />
                    CPU Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>{systemStatus.metrics.cpu.usage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          systemStatus.metrics.cpu.usage > 80 ? 'bg-red-500' :
                          systemStatus.metrics.cpu.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemStatus.metrics.cpu.usage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Load Average</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>1m: {systemStatus.metrics.cpu.loadAverage[0].toFixed(2)}</div>
                      <div>5m: {systemStatus.metrics.cpu.loadAverage[1].toFixed(2)}</div>
                      <div>15m: {systemStatus.metrics.cpu.loadAverage[2].toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Memory Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{systemStatus.metrics.memory.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          systemStatus.metrics.memory.percentage > 80 ? 'bg-red-500' :
                          systemStatus.metrics.memory.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemStatus.metrics.memory.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Used</div>
                      <div className="font-medium">{formatBytes(systemStatus.metrics.memory.used)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="font-medium">{formatBytes(systemStatus.metrics.memory.total)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="h-5 w-5 mr-2" />
                    Disk Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Disk Usage</span>
                      <span>{systemStatus.metrics.disk.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          systemStatus.metrics.disk.percentage > 80 ? 'bg-red-500' :
                          systemStatus.metrics.disk.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemStatus.metrics.disk.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Used</div>
                      <div className="font-medium">{formatBytes(systemStatus.metrics.disk.used)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="font-medium">{formatBytes(systemStatus.metrics.disk.total)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Database Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Connections</div>
                    <div className="text-2xl font-bold">{systemStatus.metrics.database.connections}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Query Time</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Average</div>
                        <div className="font-medium">{systemStatus.metrics.database.queryTime.average.toFixed(2)}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Max</div>
                        <div className="font-medium">{systemStatus.metrics.database.queryTime.max.toFixed(2)}ms</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No metrics data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {systemStatus.alerts.length > 0 ? (
            <div className="space-y-3">
              {systemStatus.alerts.map((alert) => (
                <Alert key={alert.id} className={getAlertColor(alert.type)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant={alert.type === 'CRITICAL' ? 'destructive' : 'secondary'}>
                            {alert.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                          {alert.resolved && (
                            <Badge variant="outline">Resolved</Badge>
                          )}
                        </div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {alert.description}
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                          className="ml-4"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No active alerts</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemStatus.healthChecks.map((health) => (
              <Card key={health.service}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {health.service.replace('-', ' ')}
                  </CardTitle>
                  {getStatusIcon(health.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{health.status}</div>
                  <p className="text-xs text-muted-foreground">
                    Response: {health.responseTime}ms
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Checked: {new Date(health.lastChecked).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}