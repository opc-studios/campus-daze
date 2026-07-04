import axios from 'axios'
import { useUserStore } from '../stores/user'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const userStore = useUserStore()
    
    if (error.response?.status === 401 && userStore.refreshToken) {
      try {
        await userStore.refresh()
        const originalRequest = error.config
        originalRequest.headers.Authorization = `Bearer ${userStore.token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        await userStore.logout()
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
