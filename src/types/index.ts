export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Fridge {
  id: string
  name: string
  role: 'owner' | 'member' | 'viewer' | string
  created_at?: string
}

export interface AuthResult {
  user: User
  access_token: string
  refresh_token: string
  fridges: Fridge[]
}

export interface TokenResult {
  access_token: string
  refresh_token: string
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
