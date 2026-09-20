import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import { getLocalDateString } from '@/utils/date'
import type { DailySummary, Goals, NutritionLog, CookRecipeInput, CookResult } from '@/types'

export const useNutritionStore = defineStore('nutrition', () => {
  const currentDate = ref<string>(getLocalDateString())
  const dailySummary = ref<DailySummary | null>(null)
  const loading = ref<boolean>(false)

  async function fetchDaily(date?: string) {
    if (date) {
      currentDate.value = date
    }
    loading.value = true
    try {
      const data = await api.get<DailySummary>(`/nutrition/daily?date=${currentDate.value}`)
      dailySummary.value = data
    } catch (err) {
      console.error('Failed to fetch daily nutrition:', err)
    } finally {
      loading.value = false
    }
  }

  async function logMeal(payload: {
    date: string
    meal_type: string
    food_name: string
    quantity: number
    unit: string
    calories?: number
    protein?: number
    fat?: number
    carbs?: number
  }) {
    const res = await api.post<NutritionLog>('/nutrition/log', payload)
    await fetchDaily(currentDate.value)
    return res
  }

  async function deleteLog(id: string) {
    await api.delete(`/nutrition/log/${id}`)
    if (dailySummary.value) {
      dailySummary.value.logs = dailySummary.value.logs.filter((l) => l.id !== id)
      // re-calculate totals locally or fetch
      await fetchDaily(currentDate.value)
    }
  }

  async function updateGoals(goals: Goals) {
    const updated = await api.put<Goals>('/nutrition/goals', goals)
    if (dailySummary.value) {
      dailySummary.value.goals = updated
    }
    return updated
  }

  async function cookRecipe(payload: CookRecipeInput): Promise<CookResult> {
    const result = await api.post<CookResult>('/cooking/cook', payload)
    if (payload.auto_log_as_meal) {
      await fetchDaily(currentDate.value)
    }
    return result
  }

  async function consumeMeal(
    productId: string,
    amount: number,
    unit: string,
    mealType: string,
    portions?: number
  ): Promise<CookResult> {
    const result = await api.post<CookResult>('/cooking/consume', {
      product_id: productId,
      amount,
      unit,
      portions: portions ?? amount,
      meal_type: mealType,
    })
    await fetchDaily(currentDate.value)
    return result
  }


  return {
    currentDate,
    dailySummary,
    loading,
    fetchDaily,
    logMeal,
    deleteLog,
    updateGoals,
    cookRecipe,
    consumeMeal,
  }
})
