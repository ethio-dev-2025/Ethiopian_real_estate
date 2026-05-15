import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift({
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        ...action.payload,
      })
      state.unreadCount++
    },
    markAsRead: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload)
      if (index !== -1 && !state.notifications[index].read) {
        state.notifications[index].read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => { n.read = true })
      state.unreadCount = 0
    },
    clearNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter(n => !n.read).length
    },
  },
})

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  setNotifications,
} = notificationSlice.actions

export default notificationSlice.reducer
