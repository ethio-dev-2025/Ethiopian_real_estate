import api from './axiosConfig'

export const chatApi = {
  getConversations: () => api.get('/messages/conversations').then(res => res.data),
  
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`).then(res => res.data),
  
  sendMessage: (receiverId, content, listingId = null) =>
    api.post('/messages/send', { receiver_id: receiverId, content, listing_id: listingId }).then(res => res.data),
  
  markConversationRead: (userId) => api.put(`/messages/conversation/${userId}/read`).then(res => res.data),
  
  getUnreadCount: () => api.get('/messages/unread-count').then(res => res.data),
  
  sendAsGuest: (receiverId, content, guestInfo, listingId = null) =>
    api.post('/messages/send', {
      receiver_id: receiverId,
      content,
      listing_id: listingId,
      is_guest: true,
      guest_name: guestInfo.name,
      guest_email: guestInfo.email,
      guest_phone: guestInfo.phone,
    }).then(res => res.data),
  
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  
  getMessageAnalytics: () => api.get('/messages/analytics').then(res => res.data),
}

export default chatApi
