import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Search, Send, CheckCircle, Users, RefreshCw, Maximize2, Minimize2, Phone, Mail, ArrowLeft, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const AdminMessages = () => {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 30000)
    return () => {
      clearInterval(interval)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      markAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setConversations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/messages/conversations/${conversationId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const markAsRead = async (conversationId) => {
    try {
      const token = localStorage.getItem('access_token')
      await fetch(`${API_URL}/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    setSending(true)
    const messageText = newMessage
    setNewMessage('')
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver_id: selectedConversation.other_user_id,
          message: messageText
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        const tempMessage = {
          id: Date.now(),
          message: messageText,
          is_mine: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          is_read: false,
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, tempMessage])
        setTimeout(() => fetchMessages(selectedConversation.id), 500)
      } else {
        toast.error(data.detail || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString()
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // No loading spinner - just show empty content while loading
  if (loading && conversations.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Messages</h1>
          <p className="text-gray-500">Manage all user conversations</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="flex h-[600px]">
            <div className="w-80 border-r bg-gray-50">
              <div className="p-4 border-b"><h3 className="font-semibold">Conversations</h3></div>
              <div className="p-8 text-center text-gray-500">Loading conversations...</div>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation to start messaging</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-100 p-0' : ''}`}>
      <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col ${isFullscreen ? 'h-screen rounded-none' : 'h-[calc(100vh-120px)]'}`}>
        
        {/* Header */}
        <div className="border-b px-6 py-4 bg-white flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Messages</h1>
            <p className="text-sm text-gray-500">Manage all user conversations</p>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-80 border-r flex flex-col bg-gray-50 flex-shrink-0">
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b cursor-pointer transition ${selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-100'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {conv.other_user_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm truncate">{conv.other_user_name}</p>
                            <p className="text-xs text-gray-500 truncate">{conv.last_message || 'No messages'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs text-gray-400">{formatTime(conv.last_message_time)}</p>
                        {conv.unread_count > 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t bg-white">
              <button
                onClick={fetchConversations}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col bg-white">
              {/* Chat Header */}
              <div className="border-b px-6 py-4 flex justify-between items-center bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedConversation.other_user_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedConversation.other_user_name}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <Phone className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <Mail className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.is_mine ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm border'}`}>
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${msg.is_mine ? 'text-blue-200' : 'text-gray-400'}`}>
                          <span>{formatTime(msg.created_at || msg.time)}</span>
                          {msg.is_mine && msg.is_read && <CheckCircle className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4 bg-white flex-shrink-0">
                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows="2"
                    className="flex-1 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                  >
                    {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
              <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Select a conversation</p>
              <p className="text-sm text-gray-400">Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMessages