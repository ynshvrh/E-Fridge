import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type {
  MealPlan,
  CreateMealPlanInput,
  UpdateMealPlanInput,
  GeneratePlanInput,
  GenerateDayInput,
  GenerateMealInput
} from '@/types'

export const usePlannerStore = defineStore('planner', () => {
  const mealPlans = ref<MealPlan[]>([])
  const loading = ref<boolean>(false)
  const isGenerating = ref<boolean>(false)

  async function fetchPlans(startDate: string, endDate: string) {
    loading.value = true
    try {
      const data = await api.get<MealPlan[]>(`/planner?start_date=${startDate}&end_date=${endDate}`)
      mealPlans.value = data || []
    } catch (err) {
      console.error('Failed to fetch meal plans:', err)
      mealPlans.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchDayPlans(date: string) {
    loading.value = true
    try {
      const data = await api.get<MealPlan[]>(`/planner?start_date=${date}&end_date=${date}`)
      const otherMeals = mealPlans.value.filter((p) => p.date !== date)
      mealPlans.value = [...otherMeals, ...(data || [])]
    } catch (err) {
      console.error('Failed to fetch day meal plans:', err)
    } finally {
      loading.value = false
    }
  }

  async function generateDay(date: string, dietaryPreference?: string): Promise<MealPlan[]> {
    isGenerating.value = true
    try {
      const input: GenerateDayInput = { date, dietary_preference: dietaryPreference }
      const newMeals = await api.post<MealPlan[]>('/planner/generate-day', input)
      const otherMeals = mealPlans.value.filter((p) => p.date !== date)
      mealPlans.value = [...otherMeals, ...newMeals]
      return newMeals
    } finally {
      isGenerating.value = false
    }
  }

  async function generateMeal(date: string, mealType: string, dietaryPreference?: string): Promise<MealPlan> {
    isGenerating.value = true
    try {
      const input: GenerateMealInput = { date, meal_type: mealType, dietary_preference: dietaryPreference }
      const newMeal = await api.post<MealPlan>('/planner/generate-meal', input)
      const filtered = mealPlans.value.filter((p) => !(p.date === date && p.meal_type === mealType))
      mealPlans.value = [...filtered, newMeal]
      return newMeal
    } finally {
      isGenerating.value = false
    }
  }

  async function addPlan(input: CreateMealPlanInput): Promise<MealPlan> {
    const created = await api.post<MealPlan>('/planner', input)
    mealPlans.value.push(created)
    return created
  }

  async function updatePlan(id: string, input: UpdateMealPlanInput): Promise<MealPlan> {
    const updated = await api.put<MealPlan>(`/planner/${id}`, input)
    const idx = mealPlans.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      mealPlans.value[idx] = updated
    }
    return updated
  }

  async function toggleCompleted(id: string, isCompleted: boolean): Promise<MealPlan> {
    const updated = await api.patch<MealPlan>(`/planner/${id}/toggle`, { is_completed: isCompleted })
    const idx = mealPlans.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      mealPlans.value[idx].is_completed = isCompleted
    }
    return updated
  }

  async function deletePlan(id: string): Promise<void> {
    await api.delete(`/planner/${id}`)
    mealPlans.value = mealPlans.value.filter((p) => p.id !== id)
  }

  async function generatePlan(input: GeneratePlanInput): Promise<MealPlan[]> {
    isGenerating.value = true
    try {
      const generated = await api.post<MealPlan[]>('/planner/generate', input)
      await fetchPlans(input.start_date || '', '')
      return generated
    } finally {
      isGenerating.value = false
    }
  }

  async function clearPlans(startDate: string, endDate: string): Promise<void> {
    await api.delete(`/planner/clear?start_date=${startDate}&end_date=${endDate}`)
    mealPlans.value = mealPlans.value.filter((p) => p.date < startDate || p.date > endDate)
  }

  return {
    mealPlans,
    loading,
    isGenerating,
    fetchPlans,
    fetchDayPlans,
    generateDay,
    generateMeal,
    addPlan,
    updatePlan,
    toggleCompleted,
    deletePlan,
    generatePlan,
    clearPlans,
  }
})
