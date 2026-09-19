import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { User, Fridge, AuthResult } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const fridges = ref<Fridge[]>([])
  const currentFridgeId = ref<string | null>(localStorage.getItem('e_fridge_current_fridge_id'))
  const loading = ref<boolean>(false)
  const initialized = ref<boolean>(false)

  const isAuthenticated = computed(() => !!user.value)
  const currentFridge = computed(() => {
    if (!currentFridgeId.value) return fridges.value[0] || null
    return fridges.value.find((f) => f.id === currentFridgeId.value) || fridges.value[0] || null
  })

  function selectFridge(id: string) {
    currentFridgeId.value = id
    api.setFridgeId(id)
  }

  function handleAuthSuccess(data: AuthResult) {
    user.value = data.user
    fridges.value = data.fridges || []
    api.setTokens(data.access_token, data.refresh_token)

    if (fridges.value.length > 0) {
      if (!currentFridgeId.value || !fridges.value.some((f) => f.id === currentFridgeId.value)) {
        selectFridge(fridges.value[0].id)
      }
    }
  }

  async function register(email: string, name: string, password: string) {
    loading.value = true
    try {
      const data = await api.post<AuthResult>('/auth/register', { email, name, password })
      handleAuthSuccess(data)
      return data
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const data = await api.post<AuthResult>('/auth/login', { email, password })
      handleAuthSuccess(data)
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    const token = localStorage.getItem('e_fridge_access_token')
    if (!token) {
      initialized.value = true
      return
    }

    loading.value = true
    try {
      const data = await api.get<{ user: User; fridges: Fridge[] }>('/auth/me')
      user.value = data.user
      fridges.value = data.fridges || []
      if (fridges.value.length > 0 && !currentFridgeId.value) {
        selectFridge(fridges.value[0].id)
      }
    } catch {
      user.value = null
      api.clearTokens()
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function logout() {
    const refreshToken = localStorage.getItem('e_fridge_refresh_token')
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      user.value = null
      fridges.value = []
      currentFridgeId.value = null
      api.clearTokens()
    }
  }

  // Listen for 401 events
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:unauthorized', () => {
      user.value = null
      fridges.value = []
      currentFridgeId.value = null
    })
  }

  return {
    user,
    fridges,
    currentFridge,
    currentFridgeId,
    loading,
    initialized,
    isAuthenticated,
    register,
    login,
    logout,
    fetchMe,
    selectFridge,
  }
})
