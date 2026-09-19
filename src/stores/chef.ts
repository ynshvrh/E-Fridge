import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { ChatMessage, ChatResponse } from '@/types'

export const useChefStore = defineStore('chef', () => {
  const messages = ref<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Привіт! Я твій персональний шеф-кухар E-Chef. Чим можу допомогти? Можу порадити рецепт з продуктів у твоєму холодильнику або скласти план харчування.',
    },
  ])

  const loading = ref(false)
  const dietaryPreference = ref('')

  async function sendMessage(text: string) {
    if (!text.trim() || loading.value) return

    messages.value.push({
      role: 'user',
      content: text.trim(),
    })

    loading.value = true

    // Prepare history
    const history = messages.value.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await api.post<ChatResponse>('/chef/chat', {
        message: text.trim(),
        history,
        dietary_preference: dietaryPreference.value,
        language: 'uk',
      })

      messages.value.push({
        role: 'assistant',
        content: res.reply,
        recipe: res.recipe,
        shopping_suggestions: res.shopping_suggestions,
      })
    } catch (err: any) {
      messages.value.push({
        role: 'assistant',
        content: 'Вибачте, виникла помилка зв\'язку з сервісом. Спробуйте ще раз.',
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
        content: 'Чат очищено. Про що бажаєш поговорити або яку страву знайти?',
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
