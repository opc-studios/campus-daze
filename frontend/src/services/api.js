import axios from 'axios'

const API_BASE_URL = '/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 0,
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
          localStorage.setItem('accessToken', response.data.access_token)
          originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`
          return axiosInstance(originalRequest)
        } catch (err) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    transformRequest: (obj) => {
      let str = [];
      for (let p in obj)
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      return str.join("&");
    }
  }),
  refresh: (refreshToken) => axiosInstance.post('/auth/refresh', { refreshToken }),
  getMe: () => axiosInstance.get('/auth/me'),
  forgotPassword: (data) => axiosInstance.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),
}

export const characterApi = {
  create: (data) => axiosInstance.post('/characters/', data),
  getAll: () => axiosInstance.get('/characters/'),
  getById: (id) => axiosInstance.get(`/characters/${id}/`),
  update: (id, data) => axiosInstance.put(`/characters/${id}/`, data),
  updateEquipment: (id, data) => axiosInstance.put(`/characters/${id}/equipment/`, data),
  transform: (id, data) => axiosInstance.post(`/characters/${id}/transform/`, data),
}

export const battleApi = {
  start: (data) => axiosInstance.post('/battle/start', data),
  attack: (battleId) => axiosInstance.post(`/battle/${battleId}/attack`),
  skill: (battleId, data) => axiosInstance.post(`/battle/${battleId}/skill`, data),
  getResult: (battleId) => axiosInstance.get(`/battle/${battleId}/result`),
}

export const taskApi = {
  getAll: (type) => axiosInstance.get('/tasks', { params: { type } }),
  getById: (id) => axiosInstance.get(`/tasks/${id}`),
  accept: (id) => axiosInstance.post(`/tasks/${id}/accept`),
  updateProgress: (id, data) => axiosInstance.put(`/tasks/${id}/progress`, data),
  complete: (id) => axiosInstance.post(`/tasks/${id}/complete`),
}

export const mapApi = {
  getAreas: () => axiosInstance.get('/map/areas'),
  getArea: (id) => axiosInstance.get(`/map/areas/${id}`),
  explore: (id) => axiosInstance.post(`/map/areas/${id}/explore`),
}

export const npcApi = {
  getAll: () => axiosInstance.get('/npc'),
  getDialogue: (id) => axiosInstance.get(`/npc/${id}/dialogue`),
  respond: (id, data) => axiosInstance.post(`/npc/${id}/respond`, data),
}

export const rewardApi = {
  getAll: () => axiosInstance.get('/rewards'),
  claim: (id) => axiosInstance.post(`/rewards/${id}/claim`),
  getAchievements: () => axiosInstance.get('/rewards/achievements'),
}

export const restApi = {
  start: () => axiosInstance.post('/rest/start'),
  end: () => axiosInstance.post('/rest/end'),
  getOffline: () => axiosInstance.get('/rest/offline'),
}

export default axiosInstance