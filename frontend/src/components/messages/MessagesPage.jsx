import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import {
  Search, Send, Paperclip, Image, File, X, CheckCheck,
  Check, Clock, MessageCircle, AlertCircle, Loader,
  ArrowLeft, Download, Eye, FileText, FileImage, FileArchive
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'  // ← CORRECT PATH: 2 levels up to src/context
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const MessagesPage = () => {
  const { user, socket, addMessageHandler } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { conversationId: urlConversationId } = useParams()

  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typingUsers, setTypingUsers] = useState({})
  const [attachmentPreview, setAttachmentPreview] = useState(null)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState(null)
  const [fileViewerOpen, setFileViewerOpen] = useState(false)
  const [currentFile, setCurrentFile] = useState(null)

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  const getToken = () => localStorage.getItem('access_token')

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // TELEGRAM-STYLE TIMESTAMP
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    }
    const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24))
    if (diffDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[date.getDay()]
    }
    return date.toLocaleDateString()
  }

  const getFullTimestamp = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'read':
        return (
          <div className="flex items-center gap-0.5">
            <Check className="w-3 h-3 text-blue-400" />
            <Check className="w-3 h-3 text-blue-400" />
          </div>
        )
      case 'delivered':
        return (
          <div className="flex items-center gap-0.5">
            <Check className="w-3 h-3 text-gray-400" />
            <Check className="w-3 h-3 text-gray-400" />
          </div>
        )
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      default:
        return <Clock className="w-3 h-3 text-gray-400" />
    }
  }

  const getFullUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/uploads')) return `${API_URL}${url}`
    return url
  }

  const getFileIcon = (fileType, fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || ''
    if (fileType === 'image') return <FileImage className="w-8 h-8 text-purple-500" />
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-red-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const fetchConversations = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return

      const res = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setConversations([...data].sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)))
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchMessages = useCallback(async (userId) => {
    try {
      const token = getToken()
      if (!token) return

      const res = await fetch(`${API_URL}/api/messages/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        const sorted = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        setMessages(sorted)
        scrollToBottom()
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  // SIMPLIFIED FILE UPLOAD
  const uploadFile = async (file) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/api/messages/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })

    if (response.ok) {
      return await response.json()
    }
    return null
  }

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (!urlConversationId || conversations.length === 0) return
    const conv = conversations.find(c => c.id === parseInt(urlConversationId))
    if (conv && !selectedConversation) {
      setSelectedConversation(conv)
      fetchMessages(conv.user_id)
    }
  }, [urlConversationId, conversations, selectedConversation, fetchMessages])

  useEffect(() => {
    const openChatWith = location.state?.openChatWith
    const ownerName = location.state?.ownerName

    if (openChatWith && conversations.length > 0 && !selectedConversation) {
      const conversation = conversations.find(c => c.user_id === openChatWith)
      if (conversation) {
        setSelectedConversation(conversation)
        fetchMessages(conversation.user_id)
        toast.success(`Now chatting with ${ownerName || 'owner'}`)
        window.history.replaceState({}, document.title)
      }
    }
  }, [conversations, location.state, selectedConversation, fetchMessages])

  // Reset unread when conversation opens
  useEffect(() => {
    if (selectedConversation) {
      setConversations(prev => prev.map(c =>
        c.user_id === selectedConversation.user_id ? { ...c, unread_count: 0 } : c
      ))
      
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'read_receipt',
          sender_id: selectedConversation.user_id
        }))
      }
    }
  }, [selectedConversation?.user_id, socket])

  // COMPLETE SOCKET HANDLER - Receiver gets red badge, real-time updates
  useEffect(() => {
    if (!socket) return

    const handleMessage = (data) => {
      console.log('📨 WebSocket received:', data.type)

      if (data.type === 'new_message') {
        const msg = data.message
        const isSender = msg.sender_id === user?.id
        const otherUserId = isSender ? msg.receiver_id : msg.sender_id
        const isOpenConversation = selectedConversation?.user_id === otherUserId

        let previewText = msg.content || ''
        if (msg.attachment_url) {
          previewText = msg.attachment_type === 'image' ? '📷 Photo' : `📎 ${msg.attachment_name || 'File'}`
        }
        if (!previewText) previewText = 'Sent a message'

        console.log(`📨 Message - isSender: ${isSender}, otherUser: ${otherUserId}, isOpen: ${isOpenConversation}`)

        // Update conversation list with proper unread logic
        setConversations(prev => {
          const existingIndex = prev.findIndex(c => c.user_id === otherUserId)
          const timestamp = new Date().toISOString()
          let updated = [...prev]

          if (existingIndex !== -1) {
            const currentUnread = updated[existingIndex].unread_count || 0
            // Only increment unread for RECEIVER when chat is NOT open
            const newUnread = (!isSender && !isOpenConversation) ? currentUnread + 1 : 
                              (isOpenConversation ? 0 : currentUnread)

            updated[existingIndex] = {
              ...updated[existingIndex],
              last_message: previewText,
              last_message_at: timestamp,
              unread_count: newUnread,
              user_name: msg.sender_name || updated[existingIndex].user_name
            }
            const [moved] = updated.splice(existingIndex, 1)
            updated.unshift(moved)
          } else {
            updated.unshift({
              id: Date.now(),
              user_id: otherUserId,
              user_name: isSender ? selectedConversation?.user_name || 'User' : msg.sender_name || 'Unknown',
              last_message: previewText,
              last_message_at: timestamp,
              unread_count: (!isSender && !isOpenConversation) ? 1 : 0
            })
          }
          return updated
        })

        // Add message to chat if conversation is open
        if (isOpenConversation) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          scrollToBottom()
        }

        // Toast ONLY for receiver when chat is NOT open
        if (!isSender && !isOpenConversation) {
          toast.success(`💬 New message from ${msg.sender_name || 'Someone'}`, {
            duration: 3000,
            position: 'top-right'
          })
        }
      }

      if (data.type === 'message_sent' && data.message) {
        const msg = data.message
        setMessages(prev => prev.map(m =>
          m.id === msg.id ? { ...msg, status: 'sent' } : m
        ))
      }

      if (data.type === 'messages_read') {
        setMessages(prev => prev.map(m => ({
          ...m,
          status: m.sender_id === user?.id ? 'read' : m.status
        })))
      }

      if (data.type === 'typing') {
        setTypingUsers(prev => ({ ...prev, [data.sender_id]: data.is_typing }))
        setTimeout(() => setTypingUsers(prev => ({ ...prev, [data.sender_id]: false })), 2000)
      }
    }

    const removeHandler = addMessageHandler(handleMessage)
    return () => removeHandler?.()
  }, [socket, selectedConversation, addMessageHandler, user])

  const sendTyping = (isTyping) => {
    if (socket?.readyState === WebSocket.OPEN && selectedConversation) {
      socket.send(JSON.stringify({
        type: 'typing',
        receiver_id: selectedConversation.user_id,
        is_typing: isTyping
      }))
    }
  }

  const handleInputChange = (e) => {
    setInputMessage(e.target.value)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    sendTyping(true)
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1000)
  }

  // FAST SEND MESSAGE - NO SPINNER DELAY
  const sendMessage = async (file = null, fileType = null) => {
    if (!selectedConversation) return

    let messageContent = inputMessage.trim()
    if (!messageContent && !file) return

    let uploadedFile = null
    let fileSize = null
    let originalName = null
    
    if (file) {
      setUploading(true)
      fileSize = file.size
      originalName = file.name
      uploadedFile = await uploadFile(file)
      setUploading(false)
      
      if (!uploadedFile) {
        toast.error('Failed to upload file')
        return
      }
      messageContent = messageContent || ''
    }

    const tempId = Date.now()
    const isImage = file?.type?.startsWith('image/') || fileType === 'image'
    let previewText = messageContent
    if (file) {
      previewText = isImage ? '📷 Photo' : `📎 ${originalName || 'File'}`
    }
    if (!previewText) previewText = 'Sent a message'

    // Optimistic message - appears immediately
    const optimisticMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedConversation.user_id,
      content: messageContent,
      attachment_url: uploadedFile?.url || (file ? URL.createObjectURL(file) : null),
      attachment_name: originalName || file?.name,
      attachment_type: isImage ? 'image' : (fileType || (file ? 'file' : null)),
      attachment_size: fileSize,
      status: 'sending',
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMessage])
    scrollToBottom()

    // Update sender's conversation list (NO red badge)
    setConversations(prev => {
      const existingIndex = prev.findIndex(c => c.user_id === selectedConversation.user_id)
      const timestamp = new Date().toISOString()
      let updated = [...prev]
      
      if (existingIndex !== -1) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          last_message: previewText,
          last_message_at: timestamp
        }
        const [moved] = updated.splice(existingIndex, 1)
        updated.unshift(moved)
      }
      return updated
    })

    setInputMessage('')
    if (file) {
      setAttachmentPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (imageInputRef.current) imageInputRef.current.value = ''
    }

    // Send to server (async - doesn't block UI)
    try {
      const token = getToken()
      let response

      if (uploadedFile && file) {
        const formData = new FormData()
        formData.append('receiver_id', selectedConversation.user_id.toString())
        formData.append('content', messageContent)
        formData.append('file', file)

        response = await fetch(`${API_URL}/api/messages/send-with-attachment`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
      } else {
        response = await fetch(`${API_URL}/api/messages/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiver_id: selectedConversation.user_id,
            content: messageContent
          })
        })
      }

      if (response.ok) {
        const data = await response.json()
        if (data.message) {
          setMessages(prev => prev.map(m =>
            m.id === tempId ? { ...data.message, status: 'sent' } : m
          ))
        }
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        toast.error('Failed to send message')
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error('Failed to send message')
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

    sendMessage(file, type)
  }

  const removeAttachment = () => {
    setAttachmentPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !uploading) {
      e.preventDefault()
      if (inputMessage.trim()) {
        sendMessage()
      }
    }
  }

  const openFileViewer = (attachment) => {
    const url = getFullUrl(attachment.attachment_url)
    setCurrentFile({
      url,
      name: attachment.attachment_name || 'File',
      type: attachment.attachment_type,
      size: attachment.attachment_size
    })
    setFileViewerOpen(true)
  }

  const FileViewerModal = () => {
    if (!fileViewerOpen || !currentFile) return null
    
    const isImage = currentFile.type === 'image' || 
      currentFile.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setFileViewerOpen(false)}>
        <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {getFileIcon(currentFile.type, currentFile.name)}
              <div>
                <h3 className="font-semibold text-gray-900 truncate">{currentFile.name}</h3>
                {currentFile.size && <p className="text-xs text-gray-500">{formatFileSize(currentFile.size)}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <a href={currentFile.url} download={currentFile.name} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Download className="w-5 h-5" />
              </a>
              <button onClick={() => setFileViewerOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100 flex items-center justify-center min-h-[400px]">
            {isImage ? (
              <img src={currentFile.url} alt={currentFile.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            ) : (
              <div className="text-center">
                {getFileIcon(currentFile.type, currentFile.name)}
                <p className="text-gray-500 mt-4 mb-6">Preview not available</p>
                <a href={currentFile.url} download={currentFile.name} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg">
                  <Download className="w-4 h-4" /> Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const MessageBubble = ({ message, isOwn }) => {
    const hasAttachment = message.attachment_url && message.attachment_url !== 'null'
    const isImage = message.attachment_type === 'image'
    
    return (
      <div className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn ? 'bg-blue-600 text-white' : 'bg-white shadow-sm'}`}>
          {hasAttachment && !isImage && (
            <div onClick={() => openFileViewer(message)} className={`mb-2 p-2 rounded-lg cursor-pointer ${isOwn ? 'bg-blue-500/30' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-2">
                {getFileIcon(message.attachment_type, message.attachment_name)}
                <div>
                  <p className="text-sm font-medium truncate">{message.attachment_name || 'File'}</p>
                  {message.attachment_size && <p className="text-xs opacity-70">{formatFileSize(message.attachment_size)}</p>}
                </div>
                <Eye className="w-4 h-4 opacity-70" />
              </div>
            </div>
          )}
          {hasAttachment && isImage && (
            <img src={getFullUrl(message.attachment_url)} alt="Attachment" className="mb-2 max-w-full rounded-lg cursor-pointer max-h-48 object-cover" onClick={() => openFileViewer(message)} />
          )}
          {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
          <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
            <span title={getFullTimestamp(message.created_at)} className="cursor-help">{formatTime(message.created_at)}</span>
            {isOwn && getStatusIcon(message.status)}
          </div>
        </div>
      </div>
    )
  }

  const AttachmentModal = () => {
    if (!showAttachmentModal || !selectedAttachment) return null
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowAttachmentModal(false)}>
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold truncate">{selectedAttachment.name}</h3>
            <div className="flex gap-2">
              <a href={selectedAttachment.url} download className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Download className="w-5 h-5" /></a>
              <button onClick={() => setShowAttachmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 bg-gray-100 flex items-center justify-center min-h-[60vh]">
            {selectedAttachment.type === 'image' ? (
              <img src={selectedAttachment.url} alt={selectedAttachment.name} className="max-w-full max-h-[70vh] object-contain" />
            ) : (
              <div className="text-center">
                <File className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <a href={selectedAttachment.url} download className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Download className="w-4 h-4" /> Download</a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const filteredConversations = conversations.filter(c =>
    c.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-full bg-gray-100" style={{ height: 'calc(100vh - 80px)' }}>
      <FileViewerModal />
      <AttachmentModal />

      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search conversations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No conversations yet</p></div>
          ) : (
            filteredConversations.map(conv => (
              <div key={conv.id} onClick={() => { setSelectedConversation(conv); fetchMessages(conv.user_id); navigate(`/dashboard/messages/${conv.id}`) }} className={`p-3 flex gap-3 cursor-pointer hover:bg-gray-50 transition ${selectedConversation?.user_id === conv.user_id ? 'bg-blue-50' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">{conv.user_name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center"><h3 className="font-semibold truncate">{conv.user_name}</h3><span className="text-xs text-gray-400 ml-2">{formatTime(conv.last_message_at)}</span></div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                </div>
                {conv.unread_count > 0 && <div className="min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1.5 font-bold">{conv.unread_count > 99 ? '99+' : conv.unread_count}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="bg-white border-b p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">{selectedConversation.user_name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div><h3 className="font-semibold">{selectedConversation.user_name}</h3></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400"><MessageCircle className="w-16 h-16 mb-4" /><p>No messages yet</p><p className="text-sm">Send a message to start the conversation!</p></div>
              ) : (
                messages.map(msg => <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />)
              )}
              {typingUsers[selectedConversation.user_id] && <div className="text-sm text-gray-400 italic">typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t p-4">
              {attachmentPreview && (
                <div className="mb-2 p-2 bg-gray-100 rounded-lg relative inline-block">
                  <img src={attachmentPreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                  <button onClick={removeAttachment} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'file')} className="hidden" accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt,.zip,.rar" />
                <input type="file" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" accept="image/*" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Attach file"><Paperclip className="w-5 h-5" /></button>
                <button onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Attach image"><Image className="w-5 h-5" /></button>
                <textarea value={inputMessage} onChange={handleInputChange} onKeyDown={handleKeyPress} placeholder="Type a message..." rows={1} className="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={uploading} />
                <button onClick={() => sendMessage()} disabled={(!inputMessage.trim() && !attachmentPreview) || uploading} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {(uploading) ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400"><MessageCircle className="w-16 h-16 mx-auto mb-4" /><h3 className="text-xl font-semibold">Select a conversation</h3></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessagesPage