import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { SavedRecipe, CreateSavedRecipeInput } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<SavedRecipe[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  async function fetchRecipes() {
    loading.value = true
    error.value = null
    try {
      const data = await api.get<SavedRecipe[]>('/recipes')
      recipes.value = data
    } catch (err: any) {
      error.value = err?.message || 'Не вдалося завантажити збережені рецепти'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function getRecipe(id: string): Promise<SavedRecipe> {
    return await api.get<SavedRecipe>(`/recipes/${id}`)
  }

  async function saveRecipe(input: CreateSavedRecipeInput): Promise<SavedRecipe> {
    const saved = await api.post<SavedRecipe>('/recipes', input)
    recipes.value.unshift(saved)
    return saved
  }

  async function deleteRecipe(id: string): Promise<void> {
    await api.delete(`/recipes/${id}`)
    recipes.value = recipes.value.filter((r) => r.id !== id)
  }

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    getRecipe,
    saveRecipe,
    deleteRecipe,
  }
})
