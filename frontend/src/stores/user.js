import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('accessToken') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')

  const isAuthenticated = computed(() => !!accessToken.value)

  const login = async (username, password) => {
    const response = await authApi.login(username, password)
    user.value = response.user
    accessToken.value = response.tokens.access_token
    refreshToken.value = response.tokens.refresh_token
    localStorage.setItem('accessToken', accessToken.value)
    localStorage.setItem('refreshToken', refreshToken.value)
  }

  const register = async (username, password, email) => {
    const response = await authApi.register(username, password, email)
    user.value = response.user
    accessToken.value = response.tokens.access_token
    refreshToken.value = response.tokens.refresh_token
    localStorage.setItem('accessToken', accessToken.value)
    localStorage.setItem('refreshToken', refreshToken.value)
  }

  const forgotPassword = async (username) => {
    const response = await authApi.forgotPassword(username)
    return response.reset_token
  }

  const resetPassword = async (resetToken, newPassword) => {
    await authApi.resetPassword(resetToken, newPassword)
  }

  const logout = () => {
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  const logoutWithSave = async () => {
    const { useGameStore } = await import('@/stores/game')
    const { useSaveStore } = await import('@/stores/save')
    const gameStore = useGameStore()
    const saveStore = useSaveStore()

    if (gameStore.isInGameplay) {
      try {
        const state = gameStore.getGameplayState()
        await saveStore.autoSave(state)
      } catch (e) {
        console.error('Auto-save failed before logout:', e)
      }
    }

    logout()
  }

  const fetchUser = async () => {
    if (!accessToken.value) return
    try {
      const response = await authApi.getCurrentUser()
      user.value = response
    } catch (error) {
      logout()
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    logoutWithSave,
    fetchUser
  }
})