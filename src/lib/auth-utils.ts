// Authentication utilities for localStorage-based auth
export interface User {
  id: string
  email: string
  name: string
  role: string
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  try {
    const storedUser = localStorage.getItem('coretax-user')
    if (!storedUser) return null
    
    const user = JSON.parse(storedUser)
    return user
  } catch (error) {
    console.error('Error parsing stored user:', error)
    return null
  }
}

export function getAuthHeaders(): Record<string, string> {
  const user = getCurrentUser()
  if (!user) return {}
  
  return {
    'X-User-ID': user.id,
    'X-User-Role': user.role,
    'X-User-Email': user.email
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (response.status === 401) {
    // Clear invalid user data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('coretax-user')
      window.location.href = '/auth'
    }
  }

  return response
}

export function requireAuth(): User {
  const user = getCurrentUser()
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth'
    }
    throw new Error('Authentication required')
  }
  return user
}