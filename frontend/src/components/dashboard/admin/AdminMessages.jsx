// src/components/dashboard/admin/AdminMessages.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  MessageCircle, Search, Send, CheckCircle, Users, RefreshCw, 
  Maximize2, Minimize2, Clock,
  Check, Loader, Paperclip, Image, X, File, Download,
  MessageSquare, User, Smile, Reply, Copy, Eye, Mail, Trash2, ExternalLink
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { usePresence } from '../../../context/PresenceContext'
import { useSocket } from '../../../context/SocketContext'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'
import UserStatus from '../../common/UserStatus'

const API_URL = 'http://localhost:8000'

// Real-time time formatter - shows exact time
const formatMessageTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffSeconds = Math.floor((now - date) / 1000)
  
  if (diffSeconds >= 86400) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
  
  if (diffSeconds >= 3600) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }
  
  if (diffSeconds >= 60) {
    return `${Math.floor(diffSeconds / 60)} min ago`
  }
  
  if (diffSeconds >= 5) {
    return `${diffSeconds} sec ago`
  }
  
  return 'just now'
}

const AdminMessages = () => {
  const { user } = useAuth()
  const { getUserPresence } = usePresence()
  const { socket, isConnected, addMessageHandler, emit } = useSocket()
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
  const [attachmentPreview, setAttachmentPreview] = useState(null)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState(null)
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  
  // Contact Messages State
  const [contactMessages, setContactMessages] = useState([])
  const [showContactMessages, setShowContactMessages] = useState(false)
  const [replyEmail, setReplyEmail] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedContactMessage, setSelectedContactMessage] = useState(null)
  const [sendingReply, setSendingReply] = useState(false)
  
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const inputRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const hasSentReadReceipt = useRef(false)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Telegram-style status icons
  const getStatusIcon = (status, isOwn) => {
    if (!isOwn) return null
    switch (status) {
      case 'read':
        return <CheckCircle className="w-3 h-3 text-primary-500" title="Read" />
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-gray-500" title="Delivered" />
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" title="Sent" />
      case 'sending':
        return <Loader className="w-3 h-3 animate-spin text-gray-400" title="Sending" />
      default:
        return <Clock className="w-3 h-3 text-gray-400" title="Pending" />
    }
  }

  const getFullUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/uploads')) return `${API_URL}${url}`
    return url
  }

  const getFileExtension = (filename) => {
    if (!filename) return ''
    return filename.split('.').pop().toLowerCase()
  }

  const getFileIcon = (filename) => {
    const ext = getFileExtension(filename)
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️'
    if (['pdf'].includes(ext)) return '📄'
    if (['doc', 'docx'].includes(ext)) return '📝'
    if (['xls', 'xlsx'].includes(ext)) return '📊'
    if (['ppt', 'pptx'].includes(ext)) return '📽️'
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜️'
    if (['txt', 'md'].includes(ext)) return '📃'
    return '📎'
  }

  const updateGlobalUnreadBadge = useCallback((count) => {
    window.dispatchEvent(new CustomEvent('admin_unread_update', { detail: { count } }))
    localStorage.setItem('admin_unread_count', count.toString())
  }, [])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
        const totalUnread = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
        setTotalUnreadCount(totalUnread)
        updateGlobalUnreadBadge(totalUnread)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }, [updateGlobalUnreadBadge])

  // Fetch all users
  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true)
      const accessToken = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/users?limit=1000`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const usersList = data.users || (Array.isArray(data) ? data : [])
        const filteredUsers = usersList.filter(u => u.id !== user?.id)
        
        const formattedUsers = filteredUsers.map(u => ({
          user_id: u.id,
          user_name: u.full_name || u.username,
          user_role: u.role_type,
          email: u.email,
          phone: u.phone
        }))
        setAllUsers(formattedUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch contact messages
  const fetchContactMessages = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/contact/admin/messages`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setContactMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error)
    }
  }, [])

  // Mark contact message as read
  const markContactMessageRead = async (messageId) => {
    try {
      const accessToken = localStorage.getItem('access_token')
      await fetch(`${API_URL}/api/contact/admin/messages/${messageId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      fetchContactMessages()
      toast.success('Message marked as read')
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Delete contact message
  const deleteContactMessage = async (messageId) => {
    try {
      const accessToken = localStorage.getItem('access_token')
      await fetch(`${API_URL}/api/contact/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      fetchContactMessages()
      toast.success('Message deleted')
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  // Open reply modal for contact message
  const openReplyModal = (message) => {
    setSelectedContactMessage(message)
    setReplyEmail(message.email)
    setReplySubject(`Re: ${message.subject}`)
    setReplyMessage(`\n\n--- Original Message ---\nFrom: ${message.name}\nEmail: ${message.email}\nSubject: ${message.subject}\n\n${message.message}`)
    setShowReplyModal(true)
  }

  // Send reply email
  const sendReplyEmail = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message')
      return
    }

    setSendingReply(true)
    try {
      const accessToken = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/contact/admin/send-reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_id: selectedContactMessage?.id,
          to_email: replyEmail,
          subject: replySubject,
          message: replyMessage
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Reply sent successfully!')
        setShowReplyModal(false)
        setReplyEmail('')
        setReplySubject('')
        setReplyMessage('')
        setSelectedContactMessage(null)
      } else {
        toast.error(data.detail || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Failed to send reply. Please try again.')
    } finally {
      setSendingReply(false)
    }
  }

  // Fetch messages with proper status handling
  const fetchMessages = useCallback(async (userId) => {
    try {
      const accessToken = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/messages/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const sorted = Array.isArray(data) ? [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : []
        
        const processedMessages = sorted.map(msg => ({
          ...msg,
          status: msg.is_read ? 'read' : (msg.status || 'sent')
        }))
        
        setMessages(processedMessages)
        scrollToBottom()
        
        await fetch(`${API_URL}/api/messages/mark-all-read/${userId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        
        setConversations(prev => prev.map(c =>
          c.user_id === userId ? { ...c, unread_count: 0 } : c
        ))
        
        if (socket && isConnected && !hasSentReadReceipt.current) {
          hasSentReadReceipt.current = true
          emit('read_receipt', {
            reader_id: user?.id,
            sender_id: userId
          })
          console.log(`📤 Sent read receipt to user ${userId}`)
        }
        
        const newTotal = conversations.filter(c => c.user_id !== userId).reduce((sum, c) => sum + (c.unread_count || 0), 0)
        setTotalUnreadCount(newTotal)
        updateGlobalUnreadBadge(newTotal)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [socket, isConnected, emit, user?.id, conversations, updateGlobalUnreadBadge])

  const openConversation = useCallback(async (userId, userName, userRole) => {
    console.log('🔔 Opening conversation with user:', userId, userName)
    
    let conversation = conversations.find(c => c.user_id === userId)
    
    if (!conversation) {
      conversation = {
        id: Date.now(),
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        last_message: null,
        last_message_at: null,
        unread_count: 0
      }
      setConversations(prev => [conversation, ...prev])
    }
    
    setSelectedConversation(conversation)
    await fetchMessages(userId)
    getUserPresence(userId)
    setActiveView('conversations')
    setShowContactMessages(false)
    hasSentReadReceipt.current = false
    
    setTimeout(() => {
      scrollToBottom()
    }, 500)
    
    toast.success(`Now chatting with ${userName}`)
  }, [conversations, fetchMessages, getUserPresence])

  const sendMessage = async () => {
    if (!selectedConversation) {
      toast.error('Select a conversation first')
      return
    }

    const actualFile = pendingFile?.file
    let messageContent = newMessage.trim()
    
    if (!messageContent && !actualFile) return

    setSending(true)

    let uploadedFile = null
    let fileUrl = null
    let fileName = null
    let fileTypeDetected = null

    if (actualFile) {
      uploadedFile = await uploadFile(actualFile)
      if (uploadedFile?.url) {
        fileUrl = uploadedFile.url
        fileName = uploadedFile.original_name || actualFile.name
        fileTypeDetected = uploadedFile.file_type || (actualFile.type?.startsWith('image/') ? 'image' : 'file')
      } else {
        toast.error('Failed to upload file')
        setSending(false)
        return
      }
      if (!messageContent) {
        messageContent = `Sent a ${fileTypeDetected === 'image' ? 'photo' : 'file'}`
      }
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
      is_mine: true,
      reply_to: replyingTo ? { id: replyingTo.id, content: replyingTo.content } : null
    }

    setMessages(prev => [...prev, tempMessage])
    scrollToBottom()
    setNewMessage('')
    setPendingFile(null)
    setAttachmentPreview(null)
    setReplyingTo(null)
    
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''

    try {
      const accessToken = localStorage.getItem('access_token')
      let response, data

      if (actualFile) {
        const formData = new FormData()
        formData.append('receiver_id', selectedConversation.user_id)
        formData.append('content', messageContent)
        if (replyingTo?.id) {
          formData.append('reply_to_id', replyingTo.id)
        }
        formData.append('file', actualFile)
        
        response = await fetch(`${API_URL}/api/messages/send-with-attachment`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          body: formData
        })
        data = await response.json()
      } else {
        response = await fetch(`${API_URL}/api/messages/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiver_id: selectedConversation.user_id,
            content: messageContent,
            reply_to_id: replyingTo?.id || null
          })
        })
        data = await response.json()
      }

      if (response.ok && data.success) {
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...data.message, status: 'sent', time: formatMessageTime(data.message.created_at), is_mine: true } : m
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
      setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
    }
  }

  const uploadFile = async (file) => {
    const accessToken = localStorage.getItem('access_token')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
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

  const handleFileSelect = (e, type = 'file') => {
    const file = e.target.files[0]
    if (!file) return
    
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${maxSize / 1024 / 1024}MB`)
      e.target.value = ''
      return
    }

    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setAttachmentPreview(e.target.result)
      reader.readAsDataURL(file)
      setPendingFile({ file, type })
    } else {
      setAttachmentPreview('file')
      setPendingFile({ file, type })
    }
    
    e.target.value = ''
    
    toast.success(`File "${file.name}" ready. Press Enter to send.`, {
      duration: 3000,
      icon: '📎'
    })
    
    setTimeout(() => {
      inputRef.current?.focus()
    }, 10)
  }

  const removeAttachment = () => {
    setAttachmentPreview(null)
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
    inputRef.current?.focus()
  }

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
    toast.success('Message copied to clipboard')
  }

  const onEmojiClick = (emojiData) => {
    if (showReplyModal) {
      setReplyMessage(prev => prev + emojiData.emoji)
    } else {
      setNewMessage(prev => prev + emojiData.emoji)
    }
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    
    if (socket && isConnected && selectedConversation) {
      emit('typing', {
        receiver_id: selectedConversation.user_id,
        is_typing: true
      })
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && isConnected && selectedConversation) {
        emit('typing', {
          receiver_id: selectedConversation.user_id,
          is_typing: false
        })
      }
    }, 1000)
  }

  const handleKeyPress = (e) => {
    if (showReplyModal) {
      if (e.key === 'Enter' && !e.shiftKey && !sendingReply) {
        e.preventDefault()
        sendReplyEmail()
      }
    } else if (e.key === 'Enter' && !e.shiftKey && !sending) {
      e.preventDefault()
      e.stopPropagation()
      if (newMessage.trim() || pendingFile) {
        sendMessage()
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⚠️ WebSocket not available')
      return
    }

    const handleWebSocketMessage = (data) => {
      console.log('📨 WebSocket message:', data.type)
      
      if (data.type === 'new_message') {
        const msg = data.message
        const isCurrentConversation = selectedConversation?.user_id === msg.sender_id
        
        fetchConversations()
        
        if (isCurrentConversation && msg.sender_id !== user?.id) {
          setMessages(prev => [...prev, { ...msg, is_mine: false, status: 'delivered' }])
          scrollToBottom()
          
          if (socket && isConnected) {
            emit('read_receipt', {
              reader_id: user?.id,
              sender_id: msg.sender_id
            })
          }
        } else if (!isCurrentConversation && msg.sender_id !== user?.id) {
          const notificationMsg = msg.content?.substring(0, 50) || 'Sent a message'
          toast(
            (t) => (
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  toast.dismiss(t.id)
                  openConversation(msg.sender_id, msg.sender_name, msg.sender_role)
                }}
              >
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                  {msg.sender_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold">{msg.sender_name}</p>
                  <p className="text-sm text-gray-600">{notificationMsg}</p>
                </div>
              </div>
            ),
            { duration: 8000, position: 'top-right' }
          )
        }
      }
      
      if (data.type === 'message_sent' && data.message) {
        const msg = data.message
        const isCurrentConversation = selectedConversation?.user_id === msg.receiver_id
        
        if (isCurrentConversation) {
          setMessages(prev => prev.map(m =>
            m.id === msg.id ? { ...msg, status: 'sent', time: formatMessageTime(msg.created_at), is_mine: true } : m
          ))
        }
        fetchConversations()
      }
      
      if (data.type === 'message_delivered') {
        const messageId = data.message_id
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, status: 'delivered' } : m
        ))
      }
      
      if (data.type === 'messages_read') {
        const readerId = data.reader_id
        console.log(`📖 READ RECEIPT RECEIVED: User ${readerId} read messages`)
        
        setConversations(prev => prev.map(c =>
          c.user_id === readerId ? { ...c, unread_count: 0 } : c
        ))
        
        let hasUpdates = false
        setMessages(prev => {
          const updated = prev.map(m => {
            if (m.sender_id === user?.id && m.receiver_id === readerId && m.status !== 'read') {
              console.log(`   ✅ Updating message ${m.id} status from '${m.status}' to 'read'`)
              hasUpdates = true
              return { ...m, status: 'read' }
            }
            return m
          })
          return updated
        })
        
        if (hasUpdates) {
          console.log('🔄 Messages updated with read receipts, refreshing UI')
          setTimeout(() => {
            scrollToBottom()
          }, 100)
        }
        
        const newTotal = conversations.filter(c => c.user_id !== readerId).reduce((sum, c) => sum + (c.unread_count || 0), 0)
        setTotalUnreadCount(newTotal)
        updateGlobalUnreadBadge(newTotal)
      }
      
      // Contact message notification
      if (data.type === 'new_contact_message') {
        toast.info(`📬 New contact message from ${data.message.name}`, {
          duration: 8000,
          position: 'top-right',
          icon: '📧'
        })
        fetchContactMessages()
      }
      
      if (data.type === 'typing') {
        if (data.sender_id === selectedConversation?.user_id) {
          setTypingUsers(prev => ({ ...prev, [data.sender_id]: data.is_typing }))
          setTimeout(() => {
            setTypingUsers(prev => ({ ...prev, [data.sender_id]: false }))
          }, 1500)
        }
      }
    }

    const removeHandler = addMessageHandler(handleWebSocketMessage)
    return () => {
      if (removeHandler) removeHandler()
    }
  }, [socket, isConnected, selectedConversation, addMessageHandler, emit, user?.id, fetchConversations, conversations, updateGlobalUnreadBadge, openConversation, fetchContactMessages])

  useEffect(() => {
    fetchConversations()
    fetchAllUsers()
    fetchContactMessages()
    const interval = setInterval(() => {
      fetchConversations()
      fetchContactMessages()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchConversations, fetchAllUsers, fetchContactMessages])

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv)
    fetchMessages(conv.user_id)
    getUserPresence(conv.user_id)
    setShowContactMessages(false)
    hasSentReadReceipt.current = false
  }

  const getFilteredList = () => {
    const list = activeView === 'conversations' ? conversations : allUsers
    return list.filter(item =>
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredList = getFilteredList()

  const MessageBubble = ({ message, isOwn }) => {
    const [showActions, setShowActions] = useState(false)
    const displayTime = message.time || formatMessageTime(message.created_at)
    const fileExt = getFileExtension(message.attachment_name)
    const isImage = message.attachment_type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)
    const fileIcon = getFileIcon(message.attachment_name)
    
    return (
      <div 
        className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
          <div className={`relative rounded-2xl px-4 py-2 ${isOwn ? 'bg-primary-600 text-white' : 'bg-white shadow-sm border border-border-light'}`}>
            
            {message.reply_to && (
              <div className={`text-xs mb-1 pb-1 border-b ${isOwn ? 'border-primary-400' : 'border-gray-200'}`}>
                <span className="opacity-70">↩️ Replying to: {message.reply_to.content?.substring(0, 50)}</span>
              </div>
            )}
            
            {message.attachment_url && isImage && (
              <div className="mb-2">
                <img
                  src={getFullUrl(message.attachment_url)}
                  alt={message.attachment_name || 'Image'}
                  className="max-w-full rounded-lg cursor-pointer max-h-48 object-cover"
                  onClick={() => {
                    setSelectedAttachment({
                      url: getFullUrl(message.attachment_url),
                      name: message.attachment_name || 'Image',
                      type: 'image',
                      ext: fileExt
                    })
                    setShowAttachmentModal(true)
                  }}
                />
              </div>
            )}
            
            {message.attachment_url && !isImage && (
              <div className="mb-2">
                <div
                  onClick={() => {
                    setSelectedAttachment({
                      url: getFullUrl(message.attachment_url),
                      name: message.attachment_name || 'File',
                      type: 'file',
                      ext: fileExt
                    })
                    setShowAttachmentModal(true)
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${isOwn ? 'bg-primary-700 hover:bg-primary-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <span className="text-xl">{fileIcon}</span>
                  <span className="text-sm font-medium truncate max-w-[150px]">{message.attachment_name || 'File'}</span>
                  <Eye className="w-3 h-3 opacity-50" />
                </div>
              </div>
            )}
            
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            
            {showActions && (
              <div className={`absolute -top-8 flex gap-1 bg-white rounded-lg shadow-lg p-1 z-10 ${isOwn ? 'right-0' : 'left-0'}`}>
                <button 
                  onClick={() => copyMessage(message.content)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Copy message"
                >
                  <Copy className="w-3 h-3 text-gray-600" />
                </button>
                <button 
                  onClick={() => setReplyingTo(message)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Reply"
                >
                  <Reply className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            )}
            
            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}>
              <span>{displayTime}</span>
              {getStatusIcon(message.status, isOwn)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const AttachmentModal = () => {
    if (!selectedAttachment) return null
    const { url, name, type, ext } = selectedAttachment
    const isPdf = ext === 'pdf'
    const isImage = type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
    const isDocFile = ['doc', 'docx'].includes(ext)
    const fullUrl = getFullUrl(url)
    
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`
    const pdfViewerUrl = `${fullUrl}#toolbar=1&navpanes=1&scrollbar=1`
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setShowAttachmentModal(false)}>
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getFileIcon(name)}</span>
              <h3 className="text-lg font-semibold truncate">{name}</h3>
            </div>
            <div className="flex gap-2">
              <a href={fullUrl} download={name} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Download">
                <Download className="w-5 h-5" />
              </a>
              <button onClick={() => setShowAttachmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6 bg-gray-100 flex items-center justify-center min-h-[60vh]">
            {isImage ? (
              <img src={fullUrl} alt={name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            ) : isPdf ? (
              <iframe src={pdfViewerUrl} className="w-full h-[70vh] rounded-lg shadow-lg" title={name} />
            ) : isDocFile ? (
              <iframe src={officeViewerUrl} className="w-full h-[70vh] rounded-lg shadow-lg" title={name} />
            ) : (
              <div className="text-center">
                <span className="text-8xl mb-4 block">{getFileIcon(name)}</span>
                <p className="text-gray-500 mb-4">Preview not available for this file type (.{ext})</p>
                <a href={fullUrl} download={name} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
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

  // Reply Modal Component
  const ReplyModal = () => {
    if (!showReplyModal) return null
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-text-primary">Reply to Contact Message</h2>
            <button onClick={() => setShowReplyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">To:</label>
                <input
                  type="email"
                  value={replyEmail}
                  onChange={(e) => setReplyEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg bg-gray-50"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Subject:</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Message:</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={10}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Type your reply here..."
                />
              </div>
            </div>
          </div>
          
          <div className="border-t p-4 flex justify-end gap-3">
            <button
              onClick={() => setShowReplyModal(false)}
              className="px-4 py-2 border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={sendReplyEmail}
              disabled={sendingReply}
              className="px-4 py-2 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {sendingReply ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Reply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Contact Messages List Component
  const ContactMessagesList = () => {
    if (contactMessages.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No contact messages yet</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        {contactMessages.map((msg) => (
          <div
            key={msg.id}
            className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
              msg.is_read ? 'border-l-gray-300' : 'border-l-primary-500'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-text-primary">{msg.name}</h3>
                <p className="text-sm text-text-muted">{msg.email}</p>
                {msg.phone && <p className="text-sm text-text-muted">{msg.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">{formatMessageTime(msg.created_at)}</p>
                {!msg.is_read && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                    New
                  </span>
                )}
              </div>
            </div>
            
            <h4 className="font-medium text-text-primary mb-2">{msg.subject}</h4>
            <p className="text-text-secondary text-sm mb-4">{msg.message}</p>
            
            <div className="flex gap-3">
              {!msg.is_read && (
                <button
                  onClick={() => markContactMessageRead(msg.id)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Mark as Read
                </button>
              )}
              <button
                onClick={() => openReplyModal(msg)}
                className="text-sm text-success hover:text-success-600 flex items-center gap-1"
              >
                <Reply className="w-3 h-3" /> Reply
              </button>
              <button
                onClick={() => deleteContactMessage(msg.id)}
                className="text-sm text-error hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <a
                href={`mailto:${msg.email}`}
                className="text-sm text-text-muted hover:text-text-secondary flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3" /> Open in Email
              </a>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading && conversations.length === 0 && allUsers.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Admin Messages</h1>
          <p className="text-sm text-text-muted">Communicate with sellers, landlords, and buyers</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">
          <div className="flex h-[600px]">
            <div className="w-80 border-r bg-gray-50 p-8 text-center text-gray-500">Loading...</div>
            <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation to start messaging</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-0' : ''}`}>
      {showAttachmentModal && <AttachmentModal />}
      {showReplyModal && <ReplyModal />}
      
      <div className={`bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden flex flex-col ${isFullscreen ? 'h-screen rounded-none' : 'h-[calc(100vh-120px)]'}`}>
        
        {/* Header */}
        <div className="border-b border-border-light px-6 py-4 bg-white flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Admin Messages</h1>
            <p className="text-sm text-text-muted">Communicate with sellers, landlords, and buyers</p>
          </div>
          <div className="flex items-center gap-3">
            {totalUnreadCount > 0 && (
              <span className="bg-error text-white text-xs font-bold rounded-full px-2 py-1 animate-pulse">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount} new
              </span>
            )}
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-border-light flex flex-col bg-gray-50 flex-shrink-0">
            <div className="p-4 border-b border-border-light bg-white">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveView('conversations')
                    setShowContactMessages(false)
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeView === 'conversations' && !showContactMessages
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Conversations
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    activeView === 'conversations' && !showContactMessages ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'
                  }`}>
                    {conversations.length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveView('all_users')
                    setShowContactMessages(false)
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeView === 'all_users' && !showContactMessages
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  All Users
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    activeView === 'all_users' && !showContactMessages ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'
                  }`}>
                    {allUsers.length}
                  </span>
                </button>
              </div>
              
              {/* Contact Messages Button */}
              <button
                onClick={() => {
                  setShowContactMessages(true)
                  setActiveView('conversations')
                  setSelectedConversation(null)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 mt-3 rounded-lg text-sm font-medium transition ${
                  showContactMessages
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Messages
                </div>
                {contactMessages.filter(m => !m.is_read).length > 0 && (
                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                    showContactMessages ? 'bg-white text-primary-600' : 'bg-error text-white'
                  }`}>
                    {contactMessages.filter(m => !m.is_read).length}
                  </span>
                )}
              </button>
            </div>

            <div className="p-4 border-b border-border-light bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={showContactMessages ? "Search contact messages..." : (activeView === 'conversations' ? "Search conversations..." : "Search all users...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-light rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {showContactMessages ? (
                <div className="p-3">
                  <ContactMessagesList />
                </div>
              ) : filteredList.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredList.map((item) => (
                  <div
                    key={item.user_id}
                    onClick={() => {
                      if (activeView === 'all_users') {
                        const existingConv = conversations.find(c => c.user_id === item.user_id)
                        if (existingConv) {
                          handleSelectConversation(existingConv)
                        } else {
                          setSelectedConversation({
                            id: Date.now(),
                            user_id: item.user_id,
                            user_name: item.user_name,
                            user_role: item.user_role,
                            last_message: null,
                            last_message_at: null,
                            unread_count: 0
                          })
                          setMessages([])
                          fetchMessages(item.user_id)
                        }
                        setActiveView('conversations')
                        setShowContactMessages(false)
                      } else {
                        handleSelectConversation(item)
                      }
                    }}
                    className={`p-4 border-b border-border-light cursor-pointer transition ${
                      selectedConversation?.user_id === item.user_id && !showContactMessages
                        ? 'bg-primary-50 border-l-4 border-l-primary-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold">
                              {item.user_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            {item.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 min-w-[18px] h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg animate-pulse-badge border border-white z-10">
                                {item.unread_count > 99 ? '99+' : item.unread_count}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm truncate text-text-primary">{item.user_name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {getRoleBadge(item.user_role)}
                              <p className="text-xs text-text-muted truncate">
                                {item.last_message || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        {item.last_message_at && (
                          <p className="text-xs text-text-muted">{formatMessageTime(item.last_message_at)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border-light bg-white">
              <button 
                onClick={() => {
                  fetchConversations()
                  fetchAllUsers()
                  fetchContactMessages()
                }} 
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-border-light rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Chat Area or Contact Messages Detail */}
          <div className="flex-1 flex flex-col bg-white">
            {showContactMessages ? (
              <div className="border-b border-border-light px-6 py-4 bg-white flex-shrink-0">
                <h2 className="text-xl font-bold text-text-primary">Contact Messages</h2>
                <p className="text-sm text-text-muted">Messages from the contact form - Click Reply to respond</p>
              </div>
            ) : selectedConversation ? (
              <>
                <div className="border-b border-border-light px-6 py-4 flex justify-between items-center bg-white flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold">
                        {selectedConversation.user_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{selectedConversation.user_name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {getRoleBadge(selectedConversation.user_role)}
                        <UserStatus userId={selectedConversation.user_id} showText={true} />
                        {typingUsers[selectedConversation.user_id] && (
                          <span className="text-xs text-text-muted ml-2">• Typing...</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {replyingTo && (
                    <div className="text-sm bg-gray-100 p-2 rounded-lg flex items-center gap-2">
                      <span>Replying to: {replyingTo.content?.substring(0, 30)}</span>
                      <button onClick={() => setReplyingTo(null)} className="text-error">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-muted">
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

                <div className="border-t border-border-light p-4 bg-white flex-shrink-0">
                  {attachmentPreview && attachmentPreview !== 'file' && (
                    <div className="mb-2 p-2 bg-gray-100 rounded-lg relative inline-block">
                      <img src={attachmentPreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                      <button onClick={removeAttachment} className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {attachmentPreview === 'file' && pendingFile && (
                    <div className="mb-2 p-2 bg-gray-100 rounded-lg relative inline-block">
                      <span className="text-xl mr-2">{getFileIcon(pendingFile.file.name)}</span>
                      <span className="text-sm">{pendingFile.file.name}</span>
                      <button onClick={removeAttachment} className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-center">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => handleFileSelect(e, 'file')} 
                      className="hidden" 
                    />
                    <input 
                      type="file" 
                      ref={imageInputRef} 
                      onChange={(e) => handleFileSelect(e, 'image')} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()} 
                      className="p-2 text-text-muted hover:bg-gray-100 rounded-lg" 
                      title="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => imageInputRef.current?.click()} 
                      className="p-2 text-text-muted hover:bg-gray-100 rounded-lg" 
                      title="Attach image"
                    >
                      <Image className="w-5 h-5" />
                    </button>
                    
                    <div className="relative" ref={emojiPickerRef}>
                      <button 
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-text-muted hover:bg-gray-100 rounded-lg"
                        title="Add emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-50">
                          <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                    </div>
                    
                    <textarea
                      ref={inputRef}
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your message..."
                      rows={1}
                      className="flex-1 border border-border-light rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={sending}
                    />
                    <button 
                      type="button"
                      onClick={() => sendMessage()} 
                      disabled={(!newMessage.trim() && !pendingFile) || sending} 
                      className="bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                    >
                      {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-text-secondary text-lg">Select a conversation or view contact messages</p>
                <p className="text-sm text-text-muted">Choose a conversation from the list or click "Contact Messages" to see form submissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminMessages