import apiClient from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  nickname: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: {
    id: number
    email: string
    nickname: string
    is_active: boolean
  }
}

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post('/api/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await apiClient.post('/api/auth/register', data)
    return response.data
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post('/api/auth/refresh', null, {
      params: { refresh_token: refreshToken }
    })
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout')
  }
}
