export interface User {
  id: string
  email: string
  name: string
  dietary_preferences?: string
  cuisine_preference?: string
  preferred_language?: string
  preferred_model?: string
  created_at: string
}

export interface FridgeMember {
  id: string
  name: string
  email: string
  role: string
  joined_at: string
}

export interface Fridge {
  id: string
  name: string
  role: 'owner' | 'member' | 'viewer' | string
  members?: FridgeMember[]
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

export interface NutritionEstimate {
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  category: string
  standard_unit: string
}

export interface BarcodeProductResult {
  barcode: string
  name: string
  category: string
  quantity: number
  unit: string
  calories: number
  protein: number
  fat: number
  carbs: number
  brands?: string
  image_url?: string
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

export interface RecipeIngredient {
  name: string
  quantity: number
  unit: string
  category: string
  in_fridge: boolean
}

export interface Recipe {
  title: string
  description: string
  prep_time_mins: number
  cook_time_mins: number
  servings: number
  calories: number
  protein_grams: number
  fat_grams: number
  carbs_grams: number
  ingredients: RecipeIngredient[]
  steps: string[]
}

export interface ShoppingSuggestion {
  name: string
  quantity: number
  unit: string
  category: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  recipe?: Recipe
  shopping_suggestions?: ShoppingSuggestion[]
}

export interface ChatRequest {
  message: string
  history?: { role: string; content: string }[]
  dietary_preference?: string
  language?: string
}

export interface ChatResponse {
  reply: string
  recipe?: Recipe
  shopping_suggestions?: ShoppingSuggestion[]
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface ShoppingItem {
  id: string
  fridge_id: string
  name: string
  category: string
  quantity: number
  unit: string
  is_bought: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ShoppingSummary {
  items: ShoppingItem[]
  total_count: number
  bought_count: number
  left_count: number
}

export interface CreateShoppingItemInput {
  name: string
  category?: string
  quantity?: number
  unit?: string
  is_bought?: boolean
}

export interface SavedRecipe {
  id: string
  user_id: string
  fridge_id?: string
  title: string
  description: string
  ingredients: {
    name: string
    amount: number
    unit: string
    in_fridge?: boolean
  }[]
  steps: string[]
  calories: number
  protein: number
  fat: number
  carbs: number
  prep_time_mins: number
  cook_time_mins: number
  servings: number
  created_at: string
}

export interface CreateSavedRecipeInput {
  title: string
  description: string
  ingredients: {
    name: string
    amount: number
    unit: string
    in_fridge?: boolean
  }[]
  steps: string[]
  calories: number
  protein: number
  fat: number
  carbs: number
  prep_time_mins: number
  cook_time_mins: number
  servings: number
}

export interface MealPlan {
  id: string
  fridge_id: string
  user_id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string
  recipe_title: string
  recipe_id?: string
  calories: number
  protein: number
  fat: number
  carbs: number
  is_completed: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface CreateMealPlanInput {
  date: string
  meal_type: string
  recipe_title: string
  recipe_id?: string
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  notes?: string
}

export interface UpdateMealPlanInput {
  date: string
  meal_type: string
  recipe_title: string
  recipe_id?: string
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  notes?: string
}

export interface GeneratePlanInput {
  days: number
  start_date?: string
  dietary_preference?: string
}

export interface UpdateProfileInput {
  name: string
  dietary_preferences: string
  cuisine_preference: string
  preferred_language: string
  preferred_model?: string
}

export interface UpdatePasswordInput {
  old_password: string
  new_password: string
}

export interface ChefChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  recipe?: Recipe
  shopping_suggestions?: ShoppingSuggestion[]
  created_at?: string
}



