import { db } from './db'
import { cache } from 'react'

// Optimized database queries with caching and better performance

export class OptimizedDB {
  // Cache for frequently accessed data
  private static cache = new Map()
  private static cacheTTL = 5 * 60 * 1000 // 5 minutes

  // Generic cache helper
  private static getCacheKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private static getCache(key: string): any {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  // Clear expired cache entries
  static clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key)
      }
    }
  }

  // Optimized user queries
  static async getUserById(id: string) {
    const cacheKey = this.getCacheKey('user:id', { id })
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        npwp: true,
        isActive: true,
        createdAt: true
      }
    })

    this.setCache(cacheKey, user)
    return user
  }

  static async getUserByEmail(email: string) {
    const cacheKey = this.getCacheKey('user:email', { email })
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        npwp: true,
        isActive: true,
        emailVerified: true
      }
    })

    this.setCache(cacheKey, user)
    return user
  }

  // Optimized tax calculations with better filtering
  static async getTaxCalculations(params: {
    userId?: string
    taxType?: string
    status?: string
    year?: number
    page?: number
    limit?: number
    search?: string
  }) {
    const { userId, taxType, status, year, page = 1, limit = 10, search } = params
    const skip = (page - 1) * limit

    const cacheKey = this.getCacheKey('taxCalculations', params)
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    const where: any = {}
    
    if (userId) where.userId = userId
    if (taxType) where.taxType = taxType
    if (status) where.status = status
    if (year) where.year = year
    
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [calculations, total] = await Promise.all([
      db.taxCalculation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.taxCalculation.count({ where })
    ])

    const result = {
      calculations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }

    this.setCache(cacheKey, result)
    return result
  }

  // Optimized notifications with unread count
  static async getNotifications(params: {
    userId: string
    type?: string
    isRead?: boolean
    page?: number
    limit?: number
  }) {
    const { userId, type, isRead, page = 1, limit = 10 } = params
    const skip = (page - 1) * limit

    const cacheKey = this.getCacheKey('notifications', params)
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    const where: any = { userId }
    if (type) where.type = type
    if (isRead !== undefined) where.isRead = isRead

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId, isRead: false }
      })
    ])

    const result = {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    }

    this.setCache(cacheKey, result)
    return result
  }

  // Optimized dashboard stats
  static async getDashboardStats(userId: string, userRole: string) {
    const cacheKey = this.getCacheKey('dashboardStats', { userId, userRole })
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    const where = userRole === 'WAJIB_PAJAK' ? { userId } : {}

    const [
      totalTaxPaid,
      thisMonthTax,
      pendingReports,
      overdueReports,
      totalReports,
      unreadNotifications
    ] = await Promise.all([
      db.payment.aggregate({
        where: { 
          ...where,
          status: 'SUCCESS'
        },
        _sum: { amount: true }
      }),
      db.payment.aggregate({
        where: { 
          ...where,
          status: 'SUCCESS',
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      }),
      db.taxReport.count({
        where: { 
          ...where,
          status: 'SUBMITTED'
        }
      }),
      db.taxReport.count({
        where: { 
          ...where,
          status: 'SUBMITTED',
          createdAt: {
            lt: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      }),
      db.taxReport.count({ where }),
      db.notification.count({
        where: { userId, isRead: false }
      })
    ])

    const stats = {
      totalTaxPaid: totalTaxPaid._sum.amount || 0,
      thisMonthTax: thisMonthTax._sum.amount || 0,
      pendingReports,
      overdueReports,
      totalReports,
      unreadNotifications,
      complianceRate: totalReports > 0 ? Math.round(((totalReports - overdueReports) / totalReports) * 100) : 100
    }

    this.setCache(cacheKey, stats)
    return stats
  }

  // Batch operations for better performance
  static async bulkCreateNotifications(notifications: Array<{
    userId: string
    title: string
    message: string
    type: string
  }>) {
    return await db.notification.createMany({
      data: notifications
    })
  }

  static async bulkUpdateNotificationStatus(
    notificationIds: string[],
    isRead: boolean
  ) {
    return await db.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { isRead, updatedAt: new Date() }
    })
  }

  // Optimized search with full-text search capabilities
  static async searchDocuments(params: {
    userId: string
    query: string
    category?: string
    page?: number
    limit?: number
  }) {
    const { userId, query, category, page = 1, limit = 10 } = params
    const skip = (page - 1) * limit

    const where: any = {
      userId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { contains: query, mode: 'insensitive' } }
      ]
    }

    if (category) where.category = category

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.document.count({ where })
    ])

    return {
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  // Create tax calculation with cache invalidation
  static async createTaxCalculation(data: any) {
    const result = await db.taxCalculation.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })
    
    // Clear relevant cache
    this.clearCacheByPattern('taxCalculations')
    this.clearCacheByPattern('dashboardStats')
    
    return result
  }

  // Invalidate cache for specific user
  static invalidateCacheForUser(userId: string) {
    const patterns = [
      `taxCalculations.*${userId}`,
      `dashboardStats.*${userId}`,
      `notifications.*${userId}`
    ]
    
    patterns.forEach(pattern => {
      this.clearCacheByPattern(pattern)
    })
  }

  // Clear cache by pattern helper
  private static clearCacheByPattern(pattern: string) {
    for (const [key] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  // Performance monitoring
  static async getQueryPerformance() {
    return {
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage()
    }
  }
}

// Export singleton instance
export const optimizedDb = OptimizedDB