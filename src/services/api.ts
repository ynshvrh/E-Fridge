import type { APIResponse } from '@/types'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const BASE_URL = `${API_BASE_URL}/api/v1`

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

  private refreshPromise: Promise<string> | null = null

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      this.clearTokens()
      window.dispatchEvent(new Event('auth:unauthorized'))
      throw new Error('Unauthorized: no refresh token')
    }

    this.refreshPromise = (async () => {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        let data: APIResponse<{ access_token: string; refresh_token: string }>
        try {
          data = await refreshRes.json()
        } catch {
          throw new Error('Refresh failed: invalid server response')
        }

        if (!refreshRes.ok || !data.success || !data.data) {
          throw new Error(data?.error?.message || 'Refresh failed')
        }

        this.setTokens(data.data.access_token, data.data.refresh_token)
        return data.data.access_token
      } catch (err) {
        this.clearTokens()
        window.dispatchEvent(new Event('auth:unauthorized'))
        throw err
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
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

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers,
      })
    } catch (networkErr: any) {
      throw new Error(`Помилка мережі: не вдалося з'єднатися з сервером (${networkErr?.message || 'перевірте з\'єднання'})`)
    }

    // Auto-refresh token if 401
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const newToken = await this.refreshAccessToken()
      headers['Authorization'] = `Bearer ${newToken}`
      let retryResponse: Response
      try {
        retryResponse = await fetch(url, { ...options, headers })
      } catch (networkErr: any) {
        throw new Error(`Помилка мережі при повторному запиті: ${networkErr?.message || 'перевірте з\'єднання'}`)
      }

      let retryData: APIResponse<T>
      try {
        retryData = await retryResponse.json()
      } catch {
        if (!retryResponse.ok) {
          throw new Error(`Помилка сервера (${retryResponse.status}): бекенд недоступний або повертає неочікувану відповідь`)
        }
        throw new Error('Некоректна відповідь сервера (очікувався JSON)')
      }

      if (!retryResponse.ok || !retryData.success) {
        throw new Error(retryData.error?.message || 'Request failed')
      }

      return retryData.data as T
    }

    let data: APIResponse<T>
    try {
      data = await response.json()
    } catch {
      if (!response.ok) {
        throw new Error(`Помилка сервера (${response.status}): бекенд недоступний або повертає неочікувану відповідь`)
      }
      throw new Error('Некоректна відповідь сервера (очікувався JSON)')
    }

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

  public patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient()
