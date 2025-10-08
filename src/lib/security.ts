import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Security utilities for CoreTax-ID system

export class SecurityUtils {
  // Input validation and sanitization
  static sanitizeInput(input: string): string {
    if (!input) return ''
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validateNPWP(npwp: string): boolean {
    // NPWP format: XX.XXX.XXX.X-XXX.XXX
    const npwpRegex = /^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/
    return npwpRegex.test(npwp)
  }

  static validatePhone(phone: string): boolean {
    // Indonesian phone number validation
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/
    return phoneRegex.test(phone.replace(/[\s-]/g, ''))
  }

  // Password security
  static hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + process.env.PASSWORD_SALT || 'coretax-salt')
      .digest('hex')
  }

  static validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length < 8) {
      feedback.push('Password minimal 8 karakter')
    } else {
      score += 1
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password harus mengandung huruf kecil')
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password harus mengandung huruf besar')
    } else {
      score += 1
    }

    if (!/\d/.test(password)) {
      feedback.push('Password harus mengandung angka')
    } else {
      score += 1
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Password harus mengandung karakter spesial')
    } else {
      score += 1
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    }
  }

  // CSRF protection
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return token === sessionToken
  }

  // Rate limiting
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>()

  static checkRateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000 // 1 minute
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = this.rateLimitStore.get(identifier)

    if (!record || now > record.resetTime) {
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      })
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
    }

    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime
    }
  }

  // JWT utilities
  static generateJWT(payload: any, secret: string, expiresIn: string = '1h'): string {
    const header = { alg: 'HS256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: now + this.parseExpiresIn(expiresIn)
    }

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url')
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  static verifyJWT(token: string, secret: string): any {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.')
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url')

      if (signature !== expectedSignature) {
        throw new Error('Invalid signature')
      }

      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())
      
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired')
      }

      return payload
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  private static parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1)
    const value = parseInt(expiresIn.slice(0, -1))
    
    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 60 * 60
      case 'd': return value * 24 * 60 * 60
      default: return value
    }
  }

  // Data encryption
  static encryptData(data: string, key: string): string {
    const algorithm = 'aes-256-cbc'
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(algorithm, key)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return iv.toString('hex') + ':' + encrypted
  }

  static decryptData(encryptedData: string, key: string): string {
    try {
      const [ivHex, encrypted] = encryptedData.split(':')
      const iv = Buffer.from(ivHex, 'hex')
      const decipher = crypto.createDecipher('aes-256-cbc', key)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new Error('Failed to decrypt data')
    }
  }

  // Security headers
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  }

  // SQL injection prevention
  static sanitizeSQLQuery(query: string): string {
    // Remove potentially dangerous SQL keywords and characters
    const dangerousPatterns = [
      /(\s|^)(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)(\s|$)/gi,
      /(\s|^)(UNION|JOIN|WHERE|HAVING|GROUP BY)(\s|$)/gi,
      /(\s|^)(OR|AND)(\s+\d+\s*=\s*\d+)/gi,
      /['";\\]/g,
      /\/\*|\*\/|--/g
    ]

    let sanitized = query
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })

    return sanitized.trim()
  }

  // File upload security
  static validateFileUpload(file: {
    name: string
    size: number
    type: string
  }): { isValid: boolean; error?: string } {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' }
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds limit' }
    }

    // Check file extension
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedExtensions.includes(fileExtension)) {
      return { isValid: false, error: 'File extension not allowed' }
    }

    return { isValid: true }
  }

  // Session security
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static validateSession(sessionId: string, expectedPrefix: string = 'coretax'): boolean {
    try {
      return sessionId.startsWith(expectedPrefix) && sessionId.length === 64
    } catch {
      return false
    }
  }

  // Audit logging
  static logSecurityEvent(event: {
    type: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'ACCESS_DENIED' | 'DATA_BREACH' | 'SUSPICIOUS_ACTIVITY'
    userId?: string
    ipAddress: string
    userAgent: string
    details: any
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
      severity: this.getEventSeverity(event.type)
    }

    // In production, this would be sent to a secure logging system
    console.log('SECURITY_AUDIT:', JSON.stringify(logEntry))
    
    // Here you would also send to SIEM system or security monitoring service
  }

  private static getEventSeverity(type: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (type) {
      case 'DATA_BREACH':
        return 'CRITICAL'
      case 'SUSPICIOUS_ACTIVITY':
        return 'HIGH'
      case 'ACCESS_DENIED':
        return 'MEDIUM'
      case 'AUTH_FAILURE':
        return 'MEDIUM'
      case 'AUTH_SUCCESS':
        return 'LOW'
      default:
        return 'LOW'
    }
  }

  // API security middleware
  static async securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
    // Check security headers
    const securityHeaders = this.getSecurityHeaders()
    
    // Rate limiting by IP
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = this.checkRateLimit(clientIP, 100, 60000)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            ...securityHeaders,
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    // Validate content type for POST/PUT requests
    if (['POST', 'PUT'].includes(request.method)) {
      const contentType = request.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Invalid content type' },
          { 
            status: 400,
            headers: securityHeaders
          }
        )
      }
    }

    // Add security headers to response
    const response = NextResponse.next()
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())

    return null // Continue with normal processing
  }
}

// Export security utilities
export const security = SecurityUtils

// Security constants
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_AGE: 90, // days
  SESSION_TIMEOUT: 3600, // seconds
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900, // seconds (15 minutes)
  RATE_LIMIT_WINDOW: 60000, // milliseconds
  RATE_LIMIT_MAX_REQUESTS: 100,
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-encryption-key'
}