import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { MealPlan, CreateMealPlanInput, UpdateMealPlanInput, GeneratePlanInput } from '@/types'

export const usePlannerStore = defineStore('planner', () => {
  const mealPlans = ref<MealPlan[]>([])
  const loading = ref<boolean>(false)

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
    loading.value = true
    try {
      const generated = await api.post<MealPlan[]>('/planner/generate', input)
      await fetchPlans(input.start_date || '', '')
      return generated
    } finally {
      loading.value = false
    }
  }

  async function clearPlans(startDate: string, endDate: string): Promise<void> {
    await api.delete(`/planner/clear?start_date=${startDate}&end_date=${endDate}`)
    mealPlans.value = mealPlans.value.filter((p) => p.date < startDate || p.date > endDate)
  }

  return {
    mealPlans,
    loading,
    fetchPlans,
    addPlan,
    updatePlan,
    toggleCompleted,
    deletePlan,
    generatePlan,
    clearPlans,
  }
})
