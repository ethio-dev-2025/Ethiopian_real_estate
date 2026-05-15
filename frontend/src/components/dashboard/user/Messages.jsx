import React, { useState, useEffect } from 'react'
import { MessageSquare, Users, Send, Search, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const Messages = () => {
  const [conversations, setConversations] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('conversations')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { loadConversations(); loadUsers() }, [])

  const getToken = () => localStorage.getItem('access_token')

  const loadConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages/conversations`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      setConversations(await res.json())
    } catch (error) { console.error(error) }
  }

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages/users`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      setUsers(await res.json())
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const selectUser = async (selected) => {
    setSelectedUser(selected)
    try {
      const res = await fetch(`${API_URL}/api/messages/conversation/${selected.id}`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) { console.error(error) }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return
    try {
      await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: selectedUser.id, content: newMessage.trim() })
      })
      setNewMessage('')
      selectUser(selectedUser)
    } catch (error) { toast.error('Failed to send message') }
  }

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const getRoleColor = (role) => ({ admin: 'bg-purple-500', seller: 'bg-blue-500', landlord: 'bg-green-500' }[role] || 'bg-gray-500')

  return (
    <div className="bg-white rounded-2xl shadow-sm border h-[600px] flex overflow-hidden">
      <div className="w-80 border-r flex flex-col">
        <div className="flex border-b">
          <button onClick={() => setActiveTab('conversations')} className={`flex-1 p-3 text-sm ${activeTab === 'conversations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}><MessageSquare className="w-4 h-4 inline mr-2" />Conversations</button>
          <button onClick={() => setActiveTab('users')} className={`flex-1 p-3 text-sm ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}><Users className="w-4 h-4 inline mr-2" />All Users</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-4 text-center"><Loader className="animate-spin mx-auto" /></div> : activeTab === 'conversations' ? conversations.map(c => (
            <button key={c.id} onClick={() => selectUser({ id: c.user_id, name: c.name, role: c.role_type })} className="w-full p-3 border-b text-left hover:bg-gray-50">
              <div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs ${getRoleColor(c.role_type)}`}>{getInitials(c.name)}</div><div><p className="font-medium">{c.name}</p><p className="text-xs text-gray-500 truncate">{c.last_message}</p></div></div>
            </button>
          )) : users.map(u => (
            <button key={u.id} onClick={() => selectUser(u)} className="w-full p-3 border-b text-left hover:bg-gray-50">
              <div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs ${getRoleColor(u.role_type)}`}>{getInitials(u.name)}</div><div><p className="font-medium">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div></div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-3 border-b bg-gray-50"><h3 className="font-semibold">{selectedUser.name}</h3></div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 ${m.sender_id === user.id ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                    <p className="text-sm">{m.content}</p>
                    <p className={`text-xs mt-1 ${m.sender_id === user.id ? 'text-blue-200' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2"><input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} className="flex-1 p-2 border rounded-lg" placeholder="Type a message..." /><button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Send</button></div>
          </>
        ) : (<div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation to start messaging</div>)}
      </div>
    </div>
  )
}

export default Messages