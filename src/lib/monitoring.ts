// System monitoring and alerting for CoreTax-ID

export interface SystemMetrics {
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

export interface Alert {
  id: string
  type: 'WARNING' | 'ERROR' | 'CRITICAL'
  message: string
  description: string
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  metadata?: Record<string, any>
}

export interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  lastChecked: string
  details?: Record<string, any>
}

export class MonitoringService {
  private static alerts: Alert[] = []
  private static healthChecks: Map<string, HealthCheck> = new Map()
  private static metricsHistory: SystemMetrics[] = []
  private static readonly MAX_METRICS_HISTORY = 1000
  private static readonly ALERT_THRESHOLDS = {
    CPU_USAGE_WARNING: 70,
    CPU_USAGE_CRITICAL: 90,
    MEMORY_USAGE_WARNING: 80,
    MEMORY_USAGE_CRITICAL: 95,
    DISK_USAGE_WARNING: 85,
    DISK_USAGE_CRITICAL: 95,
    DATABASE_CONNECTIONS_WARNING: 80,
    DATABASE_CONNECTIONS_CRITICAL: 90,
    RESPONSE_TIME_WARNING: 1000,
    RESPONSE_TIME_CRITICAL: 3000
  }

  // Initialize monitoring service
  static async initialize(): Promise<void> {
    console.log('Initializing monitoring service...')
    
    // Start collecting metrics every 30 seconds
    setInterval(() => this.collectMetrics(), 30000)
    
    // Start health checks every 60 seconds
    setInterval(() => this.runHealthChecks(), 60000)
    
    // Start alert processing every 10 seconds
    setInterval(() => this.processAlerts(), 10000)
    
    // Initial collection
    await this.collectMetrics()
    await this.runHealthChecks()
  }

  // Collect system metrics
  static async collectMetrics(): Promise<SystemMetrics> {
    try {
      const metrics: SystemMetrics = {
        cpu: await this.getCPUUsage(),
        memory: await this.getMemoryUsage(),
        disk: await this.getDiskUsage(),
        network: await this.getNetworkUsage(),
        database: await this.getDatabaseMetrics(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }

      // Add to history
      this.metricsHistory.push(metrics)
      if (this.metricsHistory.length > this.MAX_METRICS_HISTORY) {
        this.metricsHistory.shift()
      }

      // Check for alerts
      this.checkMetricsForAlerts(metrics)

      return metrics
    } catch (error) {
      console.error('Error collecting metrics:', error)
      throw error
    }
  }

  // Get CPU usage
  private static async getCPUUsage(): Promise<{ usage: number; loadAverage: number[] }> {
    // Simulate CPU usage - in production, use system monitoring tools
    const usage = Math.random() * 100
    const loadAverage = [usage * 0.8, usage * 0.7, usage * 0.6]
    
    return { usage, loadAverage }
  }

  // Get memory usage
  private static async getMemoryUsage(): Promise<{ used: number; total: number; percentage: number }> {
    const used = process.memoryUsage().heapUsed
    const total = process.memoryUsage().heapTotal
    const percentage = (used / total) * 100
    
    return { used, total, percentage }
  }

  // Get disk usage
  private static async getDiskUsage(): Promise<{ used: number; total: number; percentage: number }> {
    // Simulate disk usage - in production, use system monitoring tools
    const used = Math.random() * 1000000000 // 1GB max
    const total = 1000000000 // 1GB
    const percentage = (used / total) * 100
    
    return { used, total, percentage }
  }

  // Get network usage
  private static async getNetworkUsage(): Promise<{ incoming: number; outgoing: number }> {
    // Simulate network usage - in production, use system monitoring tools
    return {
      incoming: Math.random() * 1000000,
      outgoing: Math.random() * 1000000
    }
  }

  // Get database metrics
  private static async getDatabaseMetrics(): Promise<{
    connections: number
    queryTime: { average: number; max: number }
  }> {
    try {
      // Simulate database metrics - in production, query actual database stats
      return {
        connections: Math.floor(Math.random() * 100),
        queryTime: {
          average: Math.random() * 100,
          max: Math.random() * 500
        }
      }
    } catch (error) {
      console.error('Error getting database metrics:', error)
      return {
        connections: 0,
        queryTime: { average: 0, max: 0 }
      }
    }
  }

  // Run health checks
  static async runHealthChecks(): Promise<void> {
    const services = [
      'database',
      'api',
      'authentication',
      'payment-gateway',
      'notification-service',
      'file-storage'
    ]

    for (const service of services) {
      try {
        const startTime = Date.now()
        const health = await this.checkServiceHealth(service)
        const responseTime = Date.now() - startTime

        const healthCheck: HealthCheck = {
          service,
          status: health.status,
          responseTime,
          lastChecked: new Date().toISOString(),
          details: health.details
        }

        this.healthChecks.set(service, healthCheck)

        // Create alert if service is unhealthy
        if (health.status === 'unhealthy') {
          this.createAlert({
            type: 'CRITICAL',
            message: `${service} service is unhealthy`,
            description: `Service ${service} failed health check`,
            metadata: { service, responseTime, details: health.details }
          })
        } else if (health.status === 'degraded') {
          this.createAlert({
            type: 'WARNING',
            message: `${service} service is degraded`,
            description: `Service ${service} is running in degraded mode`,
            metadata: { service, responseTime, details: health.details }
          })
        }
      } catch (error) {
        console.error(`Error checking health for ${service}:`, error)
        
        this.healthChecks.set(service, {
          service,
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          details: { error: error.message }
        })
      }
    }
  }

  // Check individual service health
  private static async checkServiceHealth(service: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details?: Record<string, any>
  }> {
    // Simulate health checks - in production, implement actual health checks
    const random = Math.random()
    
    if (random > 0.95) {
      return { status: 'unhealthy', details: { error: 'Service unavailable' } }
    } else if (random > 0.85) {
      return { status: 'degraded', details: { warning: 'High latency' } }
    }
    
    return { status: 'healthy', details: { version: '1.0.0' } }
  }

  // Check metrics for alerts
  private static checkMetricsForAlerts(metrics: SystemMetrics): void {
    // CPU alerts
    if (metrics.cpu.usage > this.ALERT_THRESHOLDS.CPU_USAGE_CRITICAL) {
      this.createAlert({
        type: 'CRITICAL',
        message: 'CPU usage critical',
        description: `CPU usage is ${metrics.cpu.usage.toFixed(2)}%`,
        metadata: { cpu: metrics.cpu }
      })
    } else if (metrics.cpu.usage > this.ALERT_THRESHOLDS.CPU_USAGE_WARNING) {
      this.createAlert({
        type: 'WARNING',
        message: 'CPU usage high',
        description: `CPU usage is ${metrics.cpu.usage.toFixed(2)}%`,
        metadata: { cpu: metrics.cpu }
      })
    }

    // Memory alerts
    if (metrics.memory.percentage > this.ALERT_THRESHOLDS.MEMORY_USAGE_CRITICAL) {
      this.createAlert({
        type: 'CRITICAL',
        message: 'Memory usage critical',
        description: `Memory usage is ${metrics.memory.percentage.toFixed(2)}%`,
        metadata: { memory: metrics.memory }
      })
    } else if (metrics.memory.percentage > this.ALERT_THRESHOLDS.MEMORY_USAGE_WARNING) {
      this.createAlert({
        type: 'WARNING',
        message: 'Memory usage high',
        description: `Memory usage is ${metrics.memory.percentage.toFixed(2)}%`,
        metadata: { memory: metrics.memory }
      })
    }

    // Disk alerts
    if (metrics.disk.percentage > this.ALERT_THRESHOLDS.DISK_USAGE_CRITICAL) {
      this.createAlert({
        type: 'CRITICAL',
        message: 'Disk usage critical',
        description: `Disk usage is ${metrics.disk.percentage.toFixed(2)}%`,
        metadata: { disk: metrics.disk }
      })
    } else if (metrics.disk.percentage > this.ALERT_THRESHOLDS.DISK_USAGE_WARNING) {
      this.createAlert({
        type: 'WARNING',
        message: 'Disk usage high',
        description: `Disk usage is ${metrics.disk.percentage.toFixed(2)}%`,
        metadata: { disk: metrics.disk }
      })
    }

    // Database alerts
    if (metrics.database.connections > this.ALERT_THRESHOLDS.DATABASE_CONNECTIONS_CRITICAL) {
      this.createAlert({
        type: 'CRITICAL',
        message: 'Database connections critical',
        description: `Database has ${metrics.database.connections} active connections`,
        metadata: { database: metrics.database }
      })
    } else if (metrics.database.connections > this.ALERT_THRESHOLDS.DATABASE_CONNECTIONS_WARNING) {
      this.createAlert({
        type: 'WARNING',
        message: 'Database connections high',
        description: `Database has ${metrics.database.connections} active connections`,
        metadata: { database: metrics.database }
      })
    }
  }

  // Create alert
  private static createAlert(options: {
    type: 'WARNING' | 'ERROR' | 'CRITICAL'
    message: string
    description: string
    metadata?: Record<string, any>
  }): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type,
      message: options.message,
      description: options.description,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata: options.metadata
    }

    this.alerts.push(alert)
    console.log(`ALERT [${alert.type}]: ${alert.message}`)
    
    // In production, send notifications via email, Slack, etc.
    this.sendAlertNotification(alert)
  }

  // Send alert notification
  private static sendAlertNotification(alert: Alert): void {
    // Simulate sending notification - in production, implement actual notification logic
    console.log(`Sending notification for alert: ${alert.id}`)
  }

  // Process alerts
  private static processAlerts(): void {
    // Auto-resolve old alerts after 24 hours
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    this.alerts.forEach(alert => {
      if (!alert.resolved && new Date(alert.timestamp) < twentyFourHoursAgo) {
        alert.resolved = true
        alert.resolvedAt = now.toISOString()
      }
    })
  }

  // Get current metrics
  static getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null
  }

  // Get metrics history
  static getMetricsHistory(limit: number = 100): SystemMetrics[] {
    return this.metricsHistory.slice(-limit)
  }

  // Get alerts
  static getAlerts(options?: {
    type?: 'WARNING' | 'ERROR' | 'CRITICAL'
    resolved?: boolean
    limit?: number
  }): Alert[] {
    let filteredAlerts = [...this.alerts]
    
    if (options?.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === options.type)
    }
    
    if (options?.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === options.resolved)
    }
    
    if (options?.limit) {
      filteredAlerts = filteredAlerts.slice(-options.limit)
    }
    
    return filteredAlerts.reverse() // Most recent first
  }

  // Get health checks
  static getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values())
  }

  // Get health check for specific service
  static getHealthCheck(service: string): HealthCheck | undefined {
    return this.healthChecks.get(service)
  }

  // Resolve alert
  static resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = new Date().toISOString()
      return true
    }
    return false
  }

  // Get system status summary
  static getSystemStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: SystemMetrics | null
    alerts: Alert[]
    healthChecks: HealthCheck[]
  } {
    const metrics = this.getCurrentMetrics()
    const activeAlerts = this.getAlerts({ resolved: false, limit: 10 })
    const healthChecks = this.getHealthChecks()
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    // Check for critical alerts
    if (activeAlerts.some(alert => alert.type === 'CRITICAL')) {
      status = 'unhealthy'
    } else if (activeAlerts.some(alert => alert.type === 'ERROR' || alert.type === 'WARNING')) {
      status = 'degraded'
    }
    
    // Check health checks
    const unhealthyServices = healthChecks.filter(hc => hc.status === 'unhealthy')
    if (unhealthyServices.length > 0) {
      status = 'unhealthy'
    } else {
      const degradedServices = healthChecks.filter(hc => hc.status === 'degraded')
      if (degradedServices.length > 0 && status === 'healthy') {
        status = 'degraded'
      }
    }
    
    return {
      status,
      metrics,
      alerts: activeAlerts,
      healthChecks
    }
  }

  // Generate system report
  static generateSystemReport(): {
    summary: {
      uptime: number
      totalAlerts: number
      activeAlerts: number
      systemStatus: 'healthy' | 'degraded' | 'unhealthy'
    }
    metrics: SystemMetrics | null
    alerts: Alert[]
    healthChecks: HealthCheck[]
    recommendations: string[]
  } {
    const systemStatus = this.getSystemStatus()
    const totalAlerts = this.alerts.length
    const activeAlerts = this.getAlerts({ resolved: false }).length
    
    const recommendations: string[] = []
    
    // Generate recommendations based on current state
    if (systemStatus.metrics) {
      if (systemStatus.metrics.cpu.usage > 80) {
        recommendations.push('Consider scaling up CPU resources or optimizing CPU-intensive tasks')
      }
      
      if (systemStatus.metrics.memory.percentage > 80) {
        recommendations.push('Consider increasing memory allocation or optimizing memory usage')
      }
      
      if (systemStatus.metrics.disk.percentage > 80) {
        recommendations.push('Consider cleaning up disk space or increasing storage capacity')
      }
    }
    
    if (activeAlerts > 10) {
      recommendations.push('High number of active alerts - investigate system issues')
    }
    
    const unhealthyServices = systemStatus.healthChecks.filter(hc => hc.status === 'unhealthy')
    if (unhealthyServices.length > 0) {
      recommendations.push(`Unhealthy services detected: ${unhealthyServices.map(s => s.service).join(', ')}`)
    }
    
    return {
      summary: {
        uptime: systemStatus.metrics?.uptime || 0,
        totalAlerts,
        activeAlerts,
        systemStatus: systemStatus.status
      },
      metrics: systemStatus.metrics,
      alerts: systemStatus.alerts,
      healthChecks: systemStatus.healthChecks,
      recommendations
    }
  }
}