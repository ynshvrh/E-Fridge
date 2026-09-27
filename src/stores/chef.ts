import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { ChatMessage, ChatResponse } from '@/types'

export const useChefStore = defineStore('chef', () => {
  const authStore = useAuthStore()

  const messages = ref<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Привіт! Я твій персональний шеф-кухар E-Chef. Чим можу допомогти? Можу порадити рецепт з продуктів у твоєму холодильнику, проаналізувати страву чи продукт з фото або скласти план харчування.',
    },
  ])

  const loading = ref(false)
  const dietaryPreference = ref('')

  async function sendMessage(text: string, imageBase64?: string) {
    const trimmed = text.trim()
    if ((!trimmed && !imageBase64) || loading.value) return

    messages.value.push({
      role: 'user',
      content: trimmed || (imageBase64 ? 'Розпізнай будь ласка продукт або страву з цього фото.' : ''),
      image_url: imageBase64,
    })

    loading.value = true

    // Prepare history without images for compact payload
    const history = messages.value.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const activeDiet = dietaryPreference.value || authStore.user?.dietary_preferences || ''
      const activeLang = authStore.user?.preferred_language || 'uk'

      const res = await api.post<ChatResponse>(
        '/chef/chat',
        {
          message: trimmed || 'Розпізнай продукт або страву на фото.',
          history,
          dietary_preference: activeDiet,
          language: activeLang,
          image_base64: imageBase64,
        },
        { timeout: 60000 }
      )

      messages.value.push({
        role: 'assistant',
        content: res.reply,
        recipe: res.recipe,
        shopping_suggestions: res.shopping_suggestions,
      })
    } catch (err: any) {
      const errorMsg = err?.message || 'Помилка зв\'язку з сервісом E-Chef. Будь ласка, спробуйте ще раз.'
      messages.value.push({
        role: 'assistant',
        content: errorMsg,
      })
    } finally {
      loading.value = false
    }
  }

  async function fetchHistory() {
    try {
      const history = await api.get<ChatMessage[]>('/chef/history')
      if (history && history.length > 0) {
        messages.value = history
      }
    } catch (err) {
      console.error('Failed to fetch chef history:', err)
    }
  }

  async function clearMessages() {
    try {
      await api.delete('/chef/history')
    } catch (err) {
      console.error('Failed to clear chef history:', err)
    }
    messages.value = [
      {
        role: 'assistant',
        content: 'Чат очищено. Про що бажаєш поговорити або яку страву розпізнати чи знайти?',
      },
    ]
  }

  return {
    messages,
    loading,
    dietaryPreference,
    sendMessage,
    clearMessages,
    fetchHistory,
  }
})
