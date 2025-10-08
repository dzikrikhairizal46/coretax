// Frontend performance optimization utilities
import React from 'react'

// Dynamic import with loading states
export function dynamicImport<T>(
  importFn: () => Promise<T>,
  fallback?: React.ComponentType,
  errorComponent?: React.ComponentType<{ error: Error }>
) {
  const LazyComponent = React.lazy(importFn)
  
  const WrappedComponent = (props: any) => {
  const fallbackElement = fallback ? React.createElement(fallback) : <div>Loading...</div>
  return (
    <React.Suspense fallback={fallbackElement}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}
  
  return WrappedComponent
}

// Image optimization utilities
export const imageOptimizer = {
  lazyLoad: (imgElement: HTMLImageElement) => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src || img.src
            img.classList.remove('lazy')
            observer.unobserve(img)
          }
        })
      })
      
      imageObserver.observe(imgElement)
    }
  },
  
  optimizeSrc: (src: string, width?: number, quality?: number) => {
    if (!src) return src
    
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    if (quality) params.set('q', quality.toString())
    
    return `${src}${src.includes('?') ? '&' : '?'}${params.toString()}`
  }
}

// Code splitting utilities
export const codeSplitter = {
  // Split components by route
  byRoute: (route: string) => {
    return () => import(`@/components/${route}`)
  },
  
  // Split large components
  byComponent: (componentName: string) => {
    return () => import(`@/components/${componentName}`)
  },
  
  // Split utilities by category
  utilities: {
    charts: () => import('@/components/ui/chart'),
    forms: () => import('@/components/ui/form'),
    tables: () => import('@/components/ui/table'),
    modals: () => import('@/components/ui/dialog')
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()
  
  static measure(name: string, fn: () => void): number {
    const start = performance.now()
    fn()
    const end = performance.now()
    const duration = end - start
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    this.metrics.get(name)!.push(duration)
    return duration
  }
  
  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    const duration = end - start
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    this.metrics.get(name)!.push(duration)
    return result
  }
  
  static getMetrics(name: string) {
    const values = this.metrics.get(name) || []
    if (values.length === 0) return null
    
    return {
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    }
  }
  
  static getAllMetrics() {
    const result: Record<string, any> = {}
    for (const [name] of this.metrics.entries()) {
      result[name] = this.getMetrics(name)
    }
    return result
  }
  
  static clearMetrics() {
    this.metrics.clear()
  }
}

// Resource loading optimization
export const resourceOptimizer = {
  preloadFont: (href: string) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.href = href
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  },
  
  preloadScript: (src: string) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = src
    document.head.appendChild(link)
  },
  
  preloadStyle: (href: string) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = href
    document.head.appendChild(link)
  }
}

// Debounce and throttle utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Memory optimization
export const memoryOptimizer = {
  cleanupEventListeners: () => {
    // Clean up orphaned event listeners
    const elements = document.querySelectorAll('*')
    elements.forEach(element => {
      const clone = element.cloneNode(true)
      element.parentNode?.replaceChild(clone, element)
    })
  },
  
  cleanupObjects: () => {
    // Force garbage collection hint
    if (window.gc) {
      window.gc()
    }
  },
  
  monitorMemory: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      }
    }
    return null
  }
}

// Network optimization
export const networkOptimizer = {
  cacheFirst: async (request: Request): Promise<Response> => {
    const cache = await caches.open('coretax-cache-v1')
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    const response = await fetch(request)
    await cache.put(request, response.clone())
    return response
  },
  
  networkFirst: async (request: Request): Promise<Response> => {
    try {
      const response = await fetch(request)
      const cache = await caches.open('coretax-cache-v1')
      await cache.put(request, response.clone())
      return response
    } catch (error) {
      const cache = await caches.open('coretax-cache-v1')
      const cached = await cache.match(request)
      if (cached) {
        return cached
      }
      throw error
    }
  }
}

// Virtual scrolling utilities
export const virtualScroller = {
  calculateVisibleRange: (
    scrollTop: number,
    itemHeight: number,
    containerHeight: number,
    totalItems: number
  ) => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      totalItems - 1
    )
    
    return {
      startIndex: Math.max(0, startIndex),
      endIndex: Math.max(0, endIndex),
      offsetY: startIndex * itemHeight
    }
  },
  
  createVirtualList: (
    items: any[],
    itemHeight: number,
    containerHeight: number,
    renderItem: (item: any, index: number) => React.ReactNode
  ) => {
    // Return a configuration object instead of a component
    return {
      itemHeight,
      containerHeight,
      totalHeight: items.length * itemHeight,
      getVisibleItems: (scrollTop: number) => {
        const { startIndex, endIndex, offsetY } = virtualScroller.calculateVisibleRange(
          scrollTop,
          itemHeight,
          containerHeight,
          items.length
        )
        
        const visibleItems = items.slice(startIndex, endIndex + 1)
        
        return {
          startIndex,
          endIndex,
          offsetY,
          visibleItems: visibleItems.map((item, index) => ({
            item,
            index: startIndex + index,
            style: {
              position: 'absolute' as const,
              top: (startIndex + index) * itemHeight,
              width: '100%',
              height: itemHeight
            }
          }))
        }
      }
    }
  }
}

// Bundle analyzer integration
export const bundleAnalyzer = {
  getBundleSize: async () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource')
      const jsResources = resources.filter(r => r.name.endsWith('.js'))
      const cssResources = resources.filter(r => r.name.endsWith('.css'))
      
      return {
        js: jsResources.reduce((acc, r) => acc + (r as any).transferSize, 0),
        css: cssResources.reduce((acc, r) => acc + (r as any).transferSize, 0),
        total: resources.reduce((acc, r) => acc + (r as any).transferSize, 0)
      }
    }
    return null
  },
  
  getLargestResources: (limit: number = 5) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource')
      return resources
        .sort((a, b) => (b as any).transferSize - (a as any).transferSize)
        .slice(0, limit)
        .map(r => ({
          name: r.name,
          size: (r as any).transferSize,
          type: r.name.split('.').pop()
        }))
    }
    return []
  }
}