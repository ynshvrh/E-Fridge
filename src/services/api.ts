import type { APIResponse } from '@/types'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const BASE_URL = `${API_BASE_URL}/api/v1`

export interface ApiRequestOptions extends RequestInit {
  timeout?: number
}

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('e_fridge_access_token')
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('e_fridge_refresh_token')
  }

  public getFridgeId(): string | null {
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

  public async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
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

    // Default timeout: 60s for AI/Chef/Planner, 25s for general API
    const isAiEndpoint = endpoint.includes('/chef') || endpoint.includes('/generate') || endpoint.includes('/planner')
    const timeoutMs = options.timeout ?? (isAiEndpoint ? 60000 : 25000)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      })
    } catch (networkErr: any) {
      if (networkErr?.name === 'AbortError') {
        throw new Error(`Перевищено час очікування відповіді від сервера (${Math.round(timeoutMs / 1000)} с). Спробуйте ще раз або перевірте мережу.`)
      }
      throw new Error(`Помилка мережі: не вдалося з'єднатися з сервером (${networkErr?.message || 'перевірте з\'єднання'})`)
    } finally {
      clearTimeout(timeoutId)
    }

    // Auto-refresh token if 401
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const newToken = await this.refreshAccessToken()
      headers['Authorization'] = `Bearer ${newToken}`

      const retryController = new AbortController()
      const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs)

      let retryResponse: Response
      try {
        retryResponse = await fetch(url, {
          ...options,
          headers,
          signal: options.signal || retryController.signal,
        })
      } catch (networkErr: any) {
        if (networkErr?.name === 'AbortError') {
          throw new Error(`Перевищено час очікування відповіді від сервера (${Math.round(timeoutMs / 1000)} с).`)
        }
        throw new Error(`Помилка мережі при повторному запиті: ${networkErr?.message || 'перевірте з\'єднання'}`)
      } finally {
        clearTimeout(retryTimeoutId)
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

  public get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options })
  }

  public post<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
  }

  public put<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
  }

  public patch<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
  }

  public delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options })
  }
}

export const api = new ApiClient()
