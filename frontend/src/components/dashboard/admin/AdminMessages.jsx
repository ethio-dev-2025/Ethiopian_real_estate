// src/components/dashboard/admin/AdminMessages.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  MessageCircle, Search, Send, CheckCircle, Users, RefreshCw, 
  Maximize2, Minimize2, Phone, Mail, Clock, UserCheck,
  Check, Loader, Paperclip, Image, X, File, Download,
  UserPlus, MessageSquare, User
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const AdminMessages = () => {
  const { user, socket, addMessageHandler } = useAuth()
  const [activeView, setActiveView] = useState('conversations')
  const [conversations, setConversations] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const [onlineUsers, setOnlineUsers] = useState({})
  const [attachmentPreview, setAttachmentPreview] = useState(null)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState(null)
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Format time for display in messages (HH:MM AM/PM)
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  // Format date for conversation list
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' })
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status, isOwn) => {
    if (!isOwn) return null
    switch (status) {
      case 'read': return <CheckCircle className="w-3 h-3 text-blue-500" title="Read" />
      case 'delivered': return <CheckCircle className="w-3 h-3 text-gray-400" title="Delivered" />
      case 'sent': return <Check className="w-3 h-3 text-gray-400" title="Sent" />
      case 'sending': return <Loader className="w-3 h-3 animate-spin text-gray-400" title="Sending" />
      default: return <Clock className="w-3 h-3 text-gray-400" title="Pending" />
    }
  }

  const getFullUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/uploads')) return `${API_URL}${url}`
    return url
  }

  // Update global sidebar badge
  const updateGlobalUnreadBadge = useCallback((count) => {
    window.dispatchEvent(new CustomEvent('admin_unread_update', { detail: { count } }))
    localStorage.setItem('admin_unread_count', count.toString())
  }, [])

  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      const filtered = (Array.isArray(data) ? data : []).filter(conv => 
        conv.user_role === 'seller' || conv.user_role === 'landlord' || conv.user_role === 'dual' || conv.user_role === 'buyer'
      )
      setConversations(filtered)
      
      const totalUnread = filtered.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
      setTotalUnreadCount(totalUnread)
      updateGlobalUnreadBadge(totalUnread)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }, [updateGlobalUnreadBadge])

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(`${API_URL}/api/admin/users?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const usersList = data.users || (Array.isArray(data) ? data : [])
        const filteredUsers = usersList.filter(u => u.id !== user?.id)
        
        const formattedUsers = filteredUsers.map(u => ({
          id: u.id,
          user_id: u.id,
          user_name: u.full_name || u.username,
          user_role: u.role_type,
          user_avatar: u.avatar_url,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
          is_online: false,
          email: u.email,
          phone: u.phone,
          status: u.status,
          is_activated: u.is_activated
        }))
        
        setAllUsers(formattedUsers)
      } else {
        console.error('Failed to fetch users:', response.status)
        setAllUsers([])
      }
    } catch (error) {
      console.error('Error fetching all users:', error)
      setAllUsers([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchMessages = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/messages/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      const sorted = Array.isArray(data) ? [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : []
      setMessages(sorted)
      scrollToBottom()
      
      // Mark messages as read when conversation is opened
      await markConversationRead(userId)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [])

  const markConversationRead = async (userId) => {
    try {
      const token = localStorage.getItem('access_token')
      await fetch(`${API_URL}/api/messages/mark-all-read/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setConversations(prev => prev.map(c =>
        c.user_id === userId ? { ...c, unread_count: 0 } : c
      ))
      
      const newTotal = conversations.filter(c => c.user_id !== userId).reduce((sum, c) => sum + (c.unread_count || 0), 0)
      setTotalUnreadCount(newTotal)
      updateGlobalUnreadBadge(newTotal)
    } catch (err) {
      console.error('Error marking conversation as read:', err)
    }
  }

  const startNewConversation = async (selectedUser) => {
    const existingConv = conversations.find(c => c.user_id === selectedUser.user_id)
    
    if (existingConv) {
      setSelectedConversation(existingConv)
      fetchMessages(existingConv.user_id)
      setActiveView('conversations')
    } else {
      const newConv = {
        id: Date.now(),
        user_id: selectedUser.user_id,
        user_name: selectedUser.user_name,
        user_role: selectedUser.user_role,
        last_message: null,
        last_message_at: null,
        unread_count: 0
      }
      setSelectedConversation(newConv)
      setMessages([])
      setActiveView('conversations')
      setConversations(prev => [newConv, ...prev])
    }
  }

  const uploadFile = async (file) => {
    const token = localStorage.getItem('access_token')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return data
      }
      return null
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const sendTyping = (isTyping) => {
    if (socket?.readyState === WebSocket.OPEN && selectedConversation) {
      socket.send(JSON.stringify({
        type: 'typing',
        receiver_id: selectedConversation.user_id,
        is_typing: isTyping
      }))
    }
  }

  const sendMessage = async (file = null) => {
    if (!selectedConversation) {
      toast.error('Select a conversation first')
      return
    }

    let messageContent = newMessage.trim()
    if (!messageContent && !file) return

    setSending(true)

    let uploadedFile = null
    let fileUrl = null
    let fileName = null
    let fileTypeDetected = null

    if (file) {
      uploadedFile = await uploadFile(file)
      if (uploadedFile?.url) {
        fileUrl = uploadedFile.url
        fileName = uploadedFile.original_name || file.name
        fileTypeDetected = uploadedFile.file_type || (file.type.startsWith('image/') ? 'image' : 'file')
      } else {
        toast.error('Failed to upload file')
        setSending(false)
        return
      }
      messageContent = messageContent || `Sent a file`
    }

    const tempId = Date.now()
    const now = new Date()
    const tempMessage = {
      id: tempId,
      sender_id: user?.id,
      receiver_id: selectedConversation.user_id,
      content: messageContent,
      attachment_url: fileUrl,
      attachment_name: fileName,
      attachment_type: fileTypeDetected,
      status: 'sending',
      created_at: now.toISOString(),
      time: formatMessageTime(now),
      is_mine: true
    }

    setMessages(prev => [...prev, tempMessage])
    scrollToBottom()
    setNewMessage('')
    setAttachmentPreview(null)

    try {
      const token = localStorage.getItem('access_token')
      let response, data

      if (file) {
        const formData = new FormData()
        formData.append('receiver_id', selectedConversation.user_id)
        formData.append('content', messageContent)
        formData.append('file', file)
        
        response = await fetch(`${API_URL}/api/messages/send-with-attachment`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
        data = await response.json()
      } else {
        response = await fetch(`${API_URL}/api/messages/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiver_id: selectedConversation.user_id,
            content: messageContent
          })
        })
        data = await response.json()
      }

      if (response.ok && data.success) {
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...data.message, is_mine: true, status: 'sent', time: formatMessageTime(data.message.created_at) } : m
        ))
        fetchConversations()
        fetchAllUsers()
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        toast.error(data.detail || data.message || 'Failed to send message')
      }
    } catch (err) {
      console.error('Send error:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (e, type = 'file') => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB')
      return
    }

    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setAttachmentPreview(e.target.result)
      reader.readAsDataURL(file)
    }

    sendMessage(file)
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    sendTyping(true)
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !sending) {
      e.preventDefault()
      if (newMessage.trim()) {
        sendMessage()
      }
    }
  }

  // WebSocket message handler for real-time updates
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ WebSocket not available')
      return
    }

    const handleWebSocketMessage = (data) => {
      if (data.type === 'new_message') {
        const msg = data.message
        const isCurrentConversation = selectedConversation?.user_id === msg.sender_id

        setConversations(prev => {
          const existingIndex = prev.findIndex(c => c.user_id === msg.sender_id)
          
          if (existingIndex !== -1) {
            const updated = [...prev]
            updated[existingIndex] = {
              ...updated[existingIndex],
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: isCurrentConversation ? 0 : (updated[existingIndex].unread_count || 0) + 1
            }
            const [moved] = updated.splice(existingIndex, 1)
            updated.unshift(moved)
            
            if (!isCurrentConversation) {
              setTotalUnreadCount(prevTotal => {
                const newTotal = prevTotal + 1
                updateGlobalUnreadBadge(newTotal)
                return newTotal
              })
            }
            return updated
          } else {
            const newConv = {
              id: Date.now(),
              user_id: msg.sender_id,
              user_name: msg.sender_name || 'User',
              user_role: msg.sender_role || 'user',
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: isCurrentConversation ? 0 : 1
            }
            if (!isCurrentConversation) {
              setTotalUnreadCount(prevTotal => {
                const newTotal = prevTotal + 1
                updateGlobalUnreadBadge(newTotal)
                return newTotal
              })
            }
            return [newConv, ...prev]
          }
        })

        if (isCurrentConversation && !msg.is_mine) {
          const newMsg = { ...msg, time: formatMessageTime(msg.created_at), is_mine: false }
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, newMsg]
          })
          scrollToBottom()
        } else if (!isCurrentConversation) {
          toast.info(`📩 New message from ${msg.sender_name || 'someone'}`, {
            duration: 5000,
            position: 'top-right',
            icon: '💬'
          })
        }
      }

      if (data.type === 'messages_read') {
        setConversations(prev => prev.map(c =>
          c.user_id === data.reader_id ? { ...c, unread_count: 0 } : c
        ))
        
        setMessages(prev => prev.map(m => ({
          ...m,
          status: m.sender_id === user?.id && m.receiver_id === data.reader_id ? 'read' : m.status
        })))
        
        setTotalUnreadCount(prevTotal => {
          const newTotal = conversations.filter(c => c.user_id !== data.reader_id).reduce((sum, c) => sum + (c.unread_count || 0), 0)
          updateGlobalUnreadBadge(newTotal)
          return newTotal
        })
      }
    }

    const removeHandler = addMessageHandler(handleWebSocketMessage)
    return () => {
      if (removeHandler) removeHandler()
    }
  }, [socket, selectedConversation, addMessageHandler, user, conversations, updateGlobalUnreadBadge])

  useEffect(() => {
    fetchConversations()
    fetchAllUsers()
    const interval = setInterval(() => {
      fetchConversations()
      fetchAllUsers()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchConversations, fetchAllUsers])

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv)
    fetchMessages(conv.user_id)
  }

  const getFilteredList = () => {
    const list = activeView === 'conversations' ? conversations : allUsers
    return list.filter(item =>
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredList = getFilteredList()
  const isUserOnline = (userId) => onlineUsers[userId] === true

  const MessageBubble = ({ message, isOwn }) => {
    // Ensure time is properly formatted
    const displayTime = message.time || formatMessageTime(message.created_at)
    
    return (
      <div className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn ? 'bg-blue-600 text-white' : 'bg-white shadow-sm'}`}>
          {message.attachment_url && message.attachment_type === 'image' && (
            <div className="mb-2">
              <img
                src={getFullUrl(message.attachment_url)}
                alt={message.attachment_name || 'Image'}
                className="max-w-full rounded-lg cursor-pointer max-h-48 object-cover"
                onClick={() => {
                  setSelectedAttachment({
                    url: getFullUrl(message.attachment_url),
                    name: message.attachment_name || 'Image',
                    type: 'image'
                  })
                  setShowAttachmentModal(true)
                }}
              />
            </div>
          )}
          {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
          <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
            <span>{displayTime}</span>
            {getStatusIcon(message.status, isOwn)}
          </div>
        </div>
      </div>
    )
  }

  const AttachmentModal = () => {
    if (!selectedAttachment) return null
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold truncate">{selectedAttachment.name}</h3>
            <div className="flex gap-2">
              <a href={selectedAttachment.url} download={selectedAttachment.name} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Download className="w-5 h-5" />
              </a>
              <button onClick={() => setShowAttachmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100 flex items-center justify-center min-h-[60vh]">
            {selectedAttachment.type === 'image' ? (
              <img src={selectedAttachment.url} alt={selectedAttachment.name} className="max-w-full max-h-[70vh] object-contain" />
            ) : (
              <div className="text-center">
                <File className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Preview not available</p>
                <a href={selectedAttachment.url} download={selectedAttachment.name} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
                  <Download className="w-4 h-4" /> Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const getRoleBadge = (role) => {
    switch(role) {
      case 'seller': return <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Seller</span>
      case 'landlord': return <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Landlord</span>
      case 'dual': return <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Dual</span>
      case 'buyer': return <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Buyer</span>
      default: return null
    }
  }

  if (loading && conversations.length === 0 && allUsers.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Messages</h1>
          <p className="text-gray-500">Communicate with sellers, landlords, and buyers</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="flex h-[600px]">
            <div className="w-80 border-r bg-gray-50 p-8 text-center text-gray-500">Loading...</div>
            <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation to start messaging</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-100 p-0' : ''}`}>
      {showAttachmentModal && <AttachmentModal />}
      
      <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col ${isFullscreen ? 'h-screen rounded-none' : 'h-[calc(100vh-120px)]'}`}>
        
        {/* Header with Unread Badge */}
        <div className="border-b px-6 py-4 bg-white flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Messages</h1>
            <p className="text-sm text-gray-500">Communicate with sellers, landlords, and buyers</p>
          </div>
          <div className="flex items-center gap-3">
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 animate-pulse">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount} new
              </span>
            )}
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-80 border-r flex flex-col bg-gray-50 flex-shrink-0">
            <div className="p-4 border-b bg-white">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('conversations')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeView === 'conversations'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Conversations
                  {conversations.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      activeView === 'conversations' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                    }`}>
                      {conversations.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveView('all_users')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeView === 'all_users'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  All Users
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    activeView === 'all_users' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                  }`}>
                    {allUsers.length}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={activeView === 'conversations' ? "Search conversations..." : "Search all users..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredList.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">
                    {activeView === 'conversations' 
                      ? 'No conversations yet. Switch to "All Users" to start a new chat.'
                      : 'No users found in database'}
                  </p>
                </div>
              ) : (
                filteredList.map((item) => (
                  <div
                    key={item.user_id}
                    onClick={() => {
                      if (activeView === 'all_users') {
                        startNewConversation(item)
                      } else {
                        handleSelectConversation(item)
                      }
                    }}
                    className={`p-4 border-b cursor-pointer transition ${
                      selectedConversation?.user_id === item.user_id 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {item.user_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            {isUserOnline(item.user_id) && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm truncate">{item.user_name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {getRoleBadge(item.user_role)}
                              <p className="text-xs text-gray-400 truncate">
                                {item.last_message || (activeView === 'all_users' ? 'Click to start conversation' : 'No messages yet')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        {item.last_message_at && (
                          <p className="text-xs text-gray-400">{formatTime(item.last_message_at)}</p>
                        )}
                        {item.unread_count > 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                            {item.unread_count > 99 ? '99+' : item.unread_count}
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
                onClick={() => {
                  fetchConversations()
                  fetchAllUsers()
                }} 
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col bg-white">
              <div className="border-b px-6 py-4 flex justify-between items-center bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {selectedConversation.user_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    {isUserOnline(selectedConversation.user_id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedConversation.user_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getRoleBadge(selectedConversation.user_role)}
                      <p className="text-xs text-gray-500">
                        {isUserOnline(selectedConversation.user_id) ? '🟢 Online' : '⚫ Offline'}
                        {typingUsers[selectedConversation.user_id] && ' • Typing...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                    <p>No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4 bg-white flex-shrink-0">
                {attachmentPreview && (
                  <div className="mb-2 p-2 bg-gray-100 rounded-lg relative inline-block">
                    <img src={attachmentPreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                    <button onClick={() => { setAttachmentPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2 items-center">
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
                  <input type="file" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" accept="image/*" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Attach file">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Attach image">
                    <Image className="w-5 h-5" />
                  </button>
                  <textarea
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    rows={1}
                    className="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button 
                    onClick={() => sendMessage()} 
                    disabled={(!newMessage.trim() && !attachmentPreview) || sending} 
                    className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
              <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Select a conversation</p>
              <p className="text-sm text-gray-400">
                {activeView === 'conversations' 
                  ? 'Choose a conversation from the list to start messaging'
                  : 'Switch to "Conversations" tab to see your chats, or click on a user to start a new conversation'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default AdminMessages 