import { NextRequest, NextResponse } from 'next/server'

interface CacheEntry {
  data: NextResponse
  timestamp: number
  etag?: string
}

export class APICache {
  private static cache = new Map<string, CacheEntry>()
  private static defaultTTL = 60 * 1000 // 1 minute default

  static generateKey(request: NextRequest): string {
    const url = new URL(request.url)
    const method = request.method
    const body = method === 'GET' ? '' : JSON.stringify(request.body)
    
    return `${method}:${url.pathname}:${url.search}:${body}`
  }

  static get(request: NextRequest): NextResponse | null {
    const key = this.generateKey(request)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if cache is expired
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key)
      return null
    }
    
    // Check If-None-Match header for ETag validation
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === entry.etag) {
      return new NextResponse(null, { status: 304 })
    }
    
    return entry.data
  }

  static set(request: NextRequest, response: NextResponse, ttl: number = this.defaultTTL): void {
    const key = this.generateKey(request)
    
    // Generate ETag from response
    const responseText = JSON.stringify(response)
    const etag = `"${Buffer.from(responseText).toString('base64')}"`
    
    // Add ETag header to response
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`)
    
    this.cache.set(key, {
      data: response,
      timestamp: Date.now(),
      etag
    })
  }

  static clear(): void {
    this.cache.clear()
  }

  static clearPattern(pattern: RegExp): void {
    for (const [key] of this.cache.entries()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  static getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage()
    }
  }
}

// Cache middleware factory
export function withCache(ttl: number = 60000) {
  return function cacheMiddleware(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
      // Try to get from cache first
      const cached = APICache.get(request)
      if (cached) {
        return cached
      }

      // Execute handler
      const response = await handler(request, ...args)
      
      // Cache the response
      APICache.set(request, response, ttl)
      
      return response
    }
  }
}

// Route-specific cache configurations
export const cacheConfig = {
  // Static data that rarely changes
  static: 24 * 60 * 60 * 1000, // 24 hours
  
  // User-specific data that changes occasionally
  user: 5 * 60 * 1000, // 5 minutes
  
  // Real-time data that changes frequently
  realtime: 30 * 1000, // 30 seconds
  
  // Dashboard data that updates periodically
  dashboard: 2 * 60 * 1000, // 2 minutes
}

// Cache invalidation helpers
export function invalidateUserCache(userId: string): void {
  APICache.clearPattern(new RegExp(`user:${userId}`))
}

export function invalidateTaxCalculationsCache(userId?: string): void {
  const pattern = userId 
    ? new RegExp(`taxCalculations.*${userId}`)
    : new RegExp('taxCalculations')
  APICache.clearPattern(pattern)
}

export function invalidateNotificationsCache(userId: string): void {
  APICache.clearPattern(new RegExp(`notifications.*${userId}`))
}

export function invalidateDashboardCache(userId: string): void {
  APICache.clearPattern(new RegExp(`dashboardStats.*${userId}`))
}

// Response optimization utilities
export function optimizeResponse(response: NextResponse): NextResponse {
  // Add compression headers
  response.headers.set('Content-Encoding', 'gzip')
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Add performance headers
  response.headers.set('Keep-Alive', 'timeout=5, max=100')
  
  return response
}

// Query optimization utilities
export function optimizeQueryParams(request: NextRequest): URLSearchParams {
  const searchParams = new URL(request.url).searchParams
  
  // Remove empty parameters
  for (const [key, value] of searchParams.entries()) {
    if (!value || value === 'null' || value === 'undefined') {
      searchParams.delete(key)
    }
  }
  
  // Limit page size
  const limit = parseInt(searchParams.get('limit') || '10')
  if (limit > 100) {
    searchParams.set('limit', '100')
  }
  
  return searchParams
}