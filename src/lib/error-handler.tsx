import { NextRequest, NextResponse } from 'next/server'

// Comprehensive error handling and logging system

export interface ErrorContext {
  userId?: string
  ipAddress?: string
  userAgent?: string
  path?: string
  method?: string
  timestamp: string
  additional?: Record<string, any>
}

export interface AppError extends Error {
  code: string
  statusCode: number
  context?: ErrorContext
  isOperational?: boolean
}

export class ErrorHandler {
  private static errorLog: Array<{
    error: AppError
    context: ErrorContext
    timestamp: string
  }> = []

  // Error classification
  static classifyError(error: any): AppError {
    if (error instanceof AppError) {
      return error
    }

    // Prisma errors
    if (error?.code?.startsWith('P')) {
      return this.handlePrismaError(error)
    }

    // Validation errors
    if (error?.name === 'ValidationError') {
      return {
        name: 'ValidationError',
        message: error.message,
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        isOperational: true
      }
    }

    // Authentication errors
    if (error?.message?.includes('Unauthorized') || error?.statusCode === 401) {
      return {
        name: 'AuthenticationError',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
        statusCode: 401,
        isOperational: true
      }
    }

    // Authorization errors
    if (error?.message?.includes('Forbidden') || error?.statusCode === 403) {
      return {
        name: 'AuthorizationError',
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        statusCode: 403,
        isOperational: true
      }
    }

    // Not found errors
    if (error?.message?.includes('Not Found') || error?.statusCode === 404) {
      return {
        name: 'NotFoundError',
        message: 'Resource not found',
        code: 'NOT_FOUND',
        statusCode: 404,
        isOperational: true
      }
    }

    // Default error
    return {
      name: 'InternalServerError',
      message: error?.message || 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      isOperational: false
    }
  }

  private static handlePrismaError(error: any): AppError {
    const prismaErrorMap: Record<string, AppError> = {
      'P2000': {
        name: 'DatabaseError',
        message: 'Database connection failed',
        code: 'DB_CONNECTION_ERROR',
        statusCode: 503,
        isOperational: true
      },
      'P2001': {
        name: 'NotFoundError',
        message: 'Record not found',
        code: 'RECORD_NOT_FOUND',
        statusCode: 404,
        isOperational: true
      },
      'P2002': {
        name: 'UniqueConstraintError',
        message: 'Duplicate record detected',
        code: 'DUPLICATE_RECORD',
        statusCode: 409,
        isOperational: true
      },
      'P2025': {
        name: 'ConstraintError',
        message: 'Foreign key constraint failed',
        code: 'FOREIGN_KEY_CONSTRAINT',
        statusCode: 400,
        isOperational: true
      }
    }

    return prismaErrorMap[error.code] || {
      name: 'DatabaseError',
      message: 'Database operation failed',
      code: 'DB_OPERATION_ERROR',
      statusCode: 500,
      isOperational: false
    }
  }

  // Error logging
  static logError(error: AppError, context: ErrorContext): void {
    const errorLogEntry = {
      error,
      context,
      timestamp: new Date().toISOString()
    }

    this.errorLog.push(errorLogEntry)

    // Keep only last 1000 errors in memory
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000)
    }

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('ERROR_LOG:', JSON.stringify(errorLogEntry, null, 2))
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogging(errorLogEntry)
    }
  }

  private static sendToExternalLogging(errorLog: any): void {
    // Here you would integrate with services like:
    // - Sentry, LogRocket, Datadog, etc.
    // For now, we'll just log to console
    console.log('PRODUCTION_ERROR:', JSON.stringify(errorLog))
  }

  // Error response formatting
  static formatErrorResponse(error: AppError): NextResponse {
    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Global error handler middleware
  static async handleApiError(
    error: any,
    request: NextRequest,
    context?: Partial<ErrorContext>
  ): Promise<NextResponse> {
    const appError = this.classifyError(error)
    
    const errorContext: ErrorContext = {
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      path: new URL(request.url).pathname,
      method: request.method,
      timestamp: new Date().toISOString(),
      ...context
    }

    this.logError(appError, errorContext)

    // Security logging for suspicious errors
    if (appError.statusCode >= 400) {
      this.logSecurityEvent(appError, errorContext)
    }

    return this.formatErrorResponse(appError)
  }

  private static logSecurityEvent(error: AppError, context: ErrorContext): void {
    const securityEvents = [
      'AUTH_REQUIRED',
      'FORBIDDEN',
      'VALIDATION_ERROR',
      'DB_CONNECTION_ERROR'
    ]

    if (securityEvents.includes(error.code)) {
      console.log('SECURITY_EVENT:', {
        type: 'SUSPICIOUS_ACTIVITY',
        code: error.code,
        path: context.path,
        ipAddress: context.ipAddress,
        timestamp: context.timestamp
      })
    }
  }

  // Async error wrapper
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    request: NextRequest,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      throw await this.handleApiError(error, request, context)
    }
  }

  // Error monitoring and metrics
  static getErrorMetrics() {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recentErrors = this.errorLog.filter(
      entry => new Date(entry.timestamp) > last24Hours
    )

    const weeklyErrors = this.errorLog.filter(
      entry => new Date(entry.timestamp) > last7Days
    )

    const errorByCode = recentErrors.reduce((acc, entry) => {
      acc[entry.error.code] = (acc[entry.error.code] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const errorByPath = recentErrors.reduce((acc, entry) => {
      const path = entry.context.path || 'unknown'
      acc[path] = (acc[path] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalErrors24h: recentErrors.length,
      totalErrors7d: weeklyErrors.length,
      errorByCode,
      errorByPath,
      uniqueErrors24h: new Set(recentErrors.map(e => e.error.code)).size,
      criticalErrors: recentErrors.filter(e => e.error.statusCode >= 500).length
    }
  }

  // Error recovery suggestions
  static getRecoverySuggestions(errorCode: string): string[] {
    const suggestions: Record<string, string[]> = {
      'DB_CONNECTION_ERROR': [
        'Check database connection status',
        'Verify database credentials',
        'Restart database service if needed',
        'Contact system administrator'
      ],
      'RECORD_NOT_FOUND': [
        'Verify the resource exists',
        'Check if you have the correct permissions',
        'Ensure the resource ID is correct'
      ],
      'DUPLICATE_RECORD': [
        'Check if the record already exists',
        'Use a unique identifier',
        'Contact support if you believe this is an error'
      ],
      'VALIDATION_ERROR': [
        'Check all required fields',
        'Ensure data format is correct',
        'Review field constraints'
      ],
      'AUTH_REQUIRED': [
        'Please log in to access this resource',
        'Check your credentials',
        'Clear browser cache and try again'
      ],
      'FORBIDDEN': [
        'Verify you have the necessary permissions',
        'Contact your administrator',
        'Check your account status'
      ]
    }

    return suggestions[errorCode] || [
      'Try again later',
      'Contact system administrator',
      'Check system status'
    ]
  }

  // Health check with error status
  static getSystemHealth() {
    const metrics = this.getErrorMetrics()
    const isHealthy = metrics.criticalErrors === 0 && metrics.totalErrors24h < 100

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      metrics,
      lastChecked: new Date().toISOString(),
      uptime: process.uptime()
    }
  }
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string = 'Database operation failed') {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Error boundary utilities
export const errorBoundary = {
  wrapComponent: (
    Component: React.ComponentType<any>,
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  ) => {
    return function ErrorBoundaryWrapper(props: any) {
      return <Component {...props} />
    }
  }
}

// Export error handler instance
export const errorHandler = ErrorHandler