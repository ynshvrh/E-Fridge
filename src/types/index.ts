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

export interface CategoryInfo {
  id: string
  label: string
  icon: string
}

export interface Product {
  id: string
  fridge_id: string
  name: string
  category: string
  quantity: number
  unit: string
  expiry_date?: string
  days_left?: number
  status: 'good' | 'warning' | 'expired'
  calories: number
  protein: number
  fat: number
  carbs: number
  notes: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateProductInput {
  name: string
  category: string
  quantity: number
  unit: string
  expiry_date?: string
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  notes?: string
}

export interface UpdateProductInput {
  name: string
  category: string
  quantity: number
  unit: string
  expiry_date?: string
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  notes?: string
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
