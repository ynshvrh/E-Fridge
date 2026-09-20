import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { User, Fridge, AuthResult, RegisterResponse } from '@/types'

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

  async function register(email: string, name: string, password: string): Promise<RegisterResponse> {
    loading.value = true
    try {
      const data = await api.post<RegisterResponse>('/auth/register', { email, name, password })
      return data
    } finally {
      loading.value = false
    }
  }

  async function confirmRegistration(email: string, code: string): Promise<AuthResult> {
    loading.value = true
    try {
      const data = await api.post<AuthResult>('/auth/register/confirm', { email, code })
      handleAuthSuccess(data)
      return data
    } finally {
      loading.value = false
    }
  }

  async function resendVerificationCode(email: string): Promise<RegisterResponse> {
    loading.value = true
    try {
      const data = await api.post<RegisterResponse>('/auth/register/resend', { email })
      return data
    } finally {
      loading.value = false
    }
  }

  async function signInWithGoogle(idToken: string): Promise<AuthResult> {
    loading.value = true
    try {
      const data = await api.post<AuthResult>('/auth/google', { id_token: idToken })
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

  async function updateProfile(payload: import('@/types').UpdateProfileInput) {
    const updated = await api.put<User>('/auth/profile', payload)
    user.value = updated
    return updated
  }

  async function updatePassword(oldPassword: string, newPassword: string) {
    return api.put('/auth/password', { old_password: oldPassword, new_password: newPassword })
  }

  async function fetchFridgeDetails(fridgeId: string): Promise<Fridge> {
    const details = await api.get<Fridge>(`/fridges/${fridgeId}`)
    const idx = fridges.value.findIndex((f) => f.id === fridgeId)
    if (idx !== -1) {
      fridges.value[idx] = details
    }
    return details
  }

  async function addFridgeMember(fridgeId: string, email: string, role: string = 'member') {
    const member = await api.post(`/fridges/${fridgeId}/members`, { email, role })
    await fetchFridgeDetails(fridgeId)
    return member
  }

  async function removeFridgeMember(fridgeId: string, userId: string) {
    await api.delete(`/fridges/${fridgeId}/members/${userId}`)
    await fetchFridgeDetails(fridgeId)
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
    confirmRegistration,
    resendVerificationCode,
    signInWithGoogle,
    login,
    logout,
    fetchMe,
    selectFridge,
    updateProfile,
    updatePassword,
    fetchFridgeDetails,
    addFridgeMember,
    removeFridgeMember,
  }
})
