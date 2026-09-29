import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: 0,
  loading: false,
  error: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload
      state.unreadCount = action.payload.reduce((sum, conv) => sum + (conv.unread || 0), 0)
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload
    },
    setMessages: (state, action) => {
      state.messages = action.payload
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload)
      const convIndex = state.conversations.findIndex(c => c.id === action.payload.sender_id || c.id === action.payload.receiver_id)
      if (convIndex !== -1) {
        state.conversations[convIndex].last_message = action.payload.content
        state.conversations[convIndex].last_message_time = action.payload.created_at
        if (action.payload.receiver_id === state.currentConversation?.id) {
          state.conversations[convIndex].unread = (state.conversations[convIndex].unread || 0) + 1
          state.unreadCount++
        }
      }
    },
    markMessagesRead: (state, action) => {
      const { conversationId } = action.payload
      const convIndex = state.conversations.findIndex(c => c.id === conversationId)
      if (convIndex !== -1) {
        state.unreadCount -= state.conversations[convIndex].unread || 0
        state.conversations[convIndex].unread = 0
      }
      state.messages = state.messages.map(msg => {
        if (msg.receiver_id === conversationId && !msg.is_read) {
          return { ...msg, is_read: true }
        }
        return msg
      })
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setConversations,
  setCurrentConversation,
  setMessages,
  addMessage,
  markMessagesRead,
  setLoading,
  setError,
  clearError,
} = chatSlice.actions

export default chatSlice.reducer
