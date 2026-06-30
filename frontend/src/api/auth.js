import api from './index'

export const authApi = {
  login: (username, password) => {
    return api.post('/auth/login/', { username, password })
  },

  register: (username, password, email) => {
    return api.post('/auth/register/', { username, password, email })
  },

  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh/', { refresh_token: refreshToken })
  },

  getCurrentUser: () => {
    return api.get('/auth/me/')
  },

  updateUser: (data) => {
    return api.put('/auth/me/update/', data)
  },

  forgotPassword: (username) => {
    return api.post('/auth/forgot-password/', { username })
  },

  resetPassword: (resetToken, newPassword) => {
    return api.post('/auth/reset-password/', { reset_token: resetToken, new_password: newPassword })
  }
}
