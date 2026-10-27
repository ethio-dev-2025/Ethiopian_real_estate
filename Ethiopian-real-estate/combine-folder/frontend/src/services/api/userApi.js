import api from './axiosConfig'

export const userApi = {
  getProfile: () => api.get('/users/me').then(res => res.data),
  
  updateProfile: (data) => api.put('/users/me', data).then(res => res.data),
  
  updateAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
  
  changePassword: (currentPassword, newPassword) =>
    api.post('/users/change-password', { current_password: currentPassword, new_password: newPassword }),
  
  getNotificationSettings: () => api.get('/users/notification-settings').then(res => res.data),
  
  updateNotificationSettings: (settings) => 
    api.put('/users/notification-settings', settings).then(res => res.data),
  
  deleteAccount: () => api.delete('/users/me'),
  
  getActivityLog: (page = 1, limit = 20) =>
    api.get(`/users/activity?page=${page}&limit=${limit}`).then(res => res.data),
}

export default userApi
