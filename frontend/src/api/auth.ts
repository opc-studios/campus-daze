import apiClient from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  nickname: string
  email?: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: {
    id: number
    username: string
    email: string | null
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
    const response = await apiClient.post('/api/auth/refresh', {
      refresh_token: refreshToken
    })
    return response.data
  },

  me: async () => {
    const response = await apiClient.get('/api/auth/me')
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout')
  }
}
