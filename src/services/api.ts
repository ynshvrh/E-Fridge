import type { APIResponse } from '@/types'

const BASE_URL = '/api/v1'

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('e_fridge_access_token')
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('e_fridge_refresh_token')
  }

  private getFridgeId(): string | null {
    return localStorage.getItem('e_fridge_current_fridge_id')
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('e_fridge_access_token', accessToken)
    localStorage.setItem('e_fridge_refresh_token', refreshToken)
  }

  public clearTokens(): void {
    localStorage.removeItem('e_fridge_access_token')
    localStorage.removeItem('e_fridge_refresh_token')
    localStorage.removeItem('e_fridge_current_fridge_id')
  }

  public setFridgeId(fridgeId: string): void {
    localStorage.setItem('e_fridge_current_fridge_id', fridgeId)
  }

  private isRefreshing = false
  private refreshSubscribers: ((token: string) => void)[] = []

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token))
    this.refreshSubscribers = []
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    const token = this.getAccessToken()
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const fridgeId = this.getFridgeId()
    if (fridgeId && !headers['X-Fridge-Id']) {
      headers['X-Fridge-Id'] = fridgeId
    }

    let response = await fetch(url, {
      ...options,
      headers,
    })

    // Auto-refresh token if 401
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        this.clearTokens()
        window.dispatchEvent(new Event('auth:unauthorized'))
        throw new Error('Unauthorized')
      }

      if (!this.isRefreshing) {
        this.isRefreshing = true
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })

          const data: APIResponse<{ access_token: string; refresh_token: string }> = await refreshRes.json()
          if (!refreshRes.ok || !data.success || !data.data) {
            throw new Error('Refresh failed')
          }

          this.setTokens(data.data.access_token, data.data.refresh_token)
          this.isRefreshing = false
          this.onRefreshed(data.data.access_token)
        } catch (err) {
          this.isRefreshing = false
          this.clearTokens()
          window.dispatchEvent(new Event('auth:unauthorized'))
          throw err
        }
      }

      // Retry request with new token
      return new Promise<T>((resolve, reject) => {
        this.refreshSubscribers.push(async (newToken: string) => {
          try {
            headers['Authorization'] = `Bearer ${newToken}`
            const retryRes = await fetch(url, { ...options, headers })
            const retryData: APIResponse<T> = await retryRes.json()
            if (!retryRes.ok || !retryData.success) {
              reject(new Error(retryData.error?.message || 'Request failed'))
            } else {
              resolve(retryData.data as T)
            }
          } catch (e) {
            reject(e)
          }
        })
      })
    }

    const data: APIResponse<T> = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Request failed')
    }

    return data.data as T
  }

  public get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  public post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient()
