import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/layout/AppSidebar'
import { Bell, CheckCircle, Clock, MessageSquare, DollarSign, Home, UserPlus, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const Notifications = () => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchNotifications() }, [])

  const getToken = () => localStorage.getItem('access_token')

  const fetchNotifications = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([
        { id: 1, type: 'message', title: 'New Message', description: 'You have a new message from Selam Tesfaye', time: '5 minutes ago', is_read: false, icon: MessageSquare, color: 'blue' },
        { id: 2, type: 'payment', title: 'Payment Received', description: 'Payment of $149 received for Seller subscription', time: '1 hour ago', is_read: false, icon: DollarSign, color: 'green' },
        { id: 3, type: 'listing', title: 'New Listing', description: 'A new property has been listed in Bole', time: '3 hours ago', is_read: true, icon: Home, color: 'purple' },
        { id: 4, type: 'user', title: 'New User Registration', description: 'A new user has registered on the platform', time: '5 hours ago', is_read: true, icon: UserPlus, color: 'orange' }
      ])
    } finally { setLoading(false) }
  }

  const markAsRead = async (id) => {
    try {
      const token = getToken()
      await fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      toast.success('Marked as read')
    } catch (error) { console.error('Error marking as read:', error) }
  }

  const markAllAsRead = async () => {
    try {
      const token = getToken()
      await fetch(`${API_URL}/api/notifications/read-all`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (error) { console.error('Error marking all as read:', error) }
  }

  const deleteNotification = async (id) => {
    try {
      const token = getToken()
      await fetch(`${API_URL}/api/notifications/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (error) { console.error('Error deleting notification:', error) }
  }

  const getIconColor = (color) => {
    const colors = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600' }
    return colors[color] || colors.blue
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="text-sm text-gray-500">Stay updated with your platform activity</p></div>
            {unreadCount > 0 && (<button onClick={markAllAsRead} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Mark all as read</button>)}
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 flex justify-between items-center"><h2 className="text-lg font-semibold">Recent Notifications</h2><span className="text-sm text-gray-500">{unreadCount} unread</span></div>
            
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center"><Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No notifications yet</p></div>
            ) : (
              <div className="space-y-3">
                {notifications.map(notif => {
                  const Icon = notif.icon
                  return (
                    <div key={notif.id} className={`bg-white rounded-xl shadow-sm border p-4 transition ${!notif.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}>
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notif.color)}`}><Icon className="w-5 h-5" /></div>
                        <div className="flex-1"><h3 className="font-semibold text-gray-900">{notif.title}</h3><p className="text-sm text-gray-500 mt-1">{notif.description}</p><div className="flex items-center gap-2 mt-2"><Clock className="w-3 h-3 text-gray-400" /><span className="text-xs text-gray-400">{notif.time}</span></div></div>
                        <div className="flex gap-2">
                          {!notif.is_read && (<button onClick={() => markAsRead(notif.id)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Mark as read"><CheckCircle className="w-4 h-4" /></button>)}
                          <button onClick={() => deleteNotification(notif.id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Notifications