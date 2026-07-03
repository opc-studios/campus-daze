import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type TokenResponse } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const userId = ref<number | null>(
    localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null
  )
  const username = ref<string | null>(localStorage.getItem('username'))
  const email = ref<string | null>(localStorage.getItem('email'))
  const nickname = ref<string | null>(localStorage.getItem('nickname'))

  const isLoggedIn = computed(() => !!token.value)

  const setAuth = (data: TokenResponse) => {
    token.value = data.access_token
    refreshToken.value = data.refresh_token
    userId.value = data.user.id
    username.value = data.user.username
    email.value = data.user.email
    nickname.value = data.user.nickname

    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refreshToken', data.refresh_token)
    localStorage.setItem('userId', String(data.user.id))
    localStorage.setItem('username', data.user.username)
    if (data.user.email) {
      localStorage.setItem('email', data.user.email)
    } else {
      localStorage.removeItem('email')
    }
    localStorage.setItem('nickname', data.user.nickname)
  }

  const login = async (username: string, password: string) => {
    const data = await authApi.login({ username, password })
    setAuth(data)
  }

  const register = async (
    username: string,
    password: string,
    nickname: string,
    email?: string
  ) => {
    const data = await authApi.register({ username, password, nickname, email })
    setAuth(data)
  }

  const refresh = async () => {
    if (!refreshToken.value) throw new Error('No refresh token')
    const data = await authApi.refresh(refreshToken.value)
    setAuth(data)
  }

  const logout = () => {
    token.value = null
    refreshToken.value = null
    userId.value = null
    username.value = null
    email.value = null
    nickname.value = null

    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    localStorage.removeItem('nickname')
  }

  return {
    token,
    refreshToken,
    userId,
    username,
    email,
    nickname,
    isLoggedIn,
    login,
    register,
    refresh,
    logout
  }
})
