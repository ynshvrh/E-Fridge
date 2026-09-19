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

export interface CookIngredient {
  name: string
  quantity: number
  unit: string
}

export interface CookRecipeInput {
  recipe_title: string
  servings: number
  expiry_days: number
  ingredients: CookIngredient[]
  ignore_missing: boolean
  auto_log_as_meal: boolean
  meal_type: string
}

export interface DeductedItem {
  product_name: string
  deducted_qty: number
  unit: string
  fully_used: boolean
}

export interface NutritionLog {
  id: string
  user_id: string
  date: string
  meal_type: string
  food_name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  fat: number
  carbs: number
  logged_at: string
}

export interface Goals {
  calorie_target: number
  protein_target: number
  fat_target: number
  carbs_target: number
}

export interface DailySummary {
  date: string
  total_calories: number
  total_protein: number
  total_fat: number
  total_carbs: number
  goals: Goals
  logs: NutritionLog[]
}

export interface CookResult {
  prepared_meal: Product
  deductions: DeductedItem[]
  missing?: string[]
  logged_meal?: NutritionLog
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
