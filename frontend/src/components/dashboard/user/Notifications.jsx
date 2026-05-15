import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle, Clock, MessageSquare, DollarSign, Home, UserPlus, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

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
      // Demo data for testing
      setNotifications([
        { id: 1, type: 'message', title: 'New Message', description: 'You have a new message from Selam Tesfaye', time: '5 minutes ago', is_read: false, icon: MessageSquare, color: 'blue' },
        { id: 2, type: 'payment', title: 'Payment Received', description: 'Payment of $149 received for Seller subscription', time: '1 hour ago', is_read: false, icon: DollarSign, color: 'green' },
        { id: 3, type: 'listing', title: 'New Listing', description: 'A new property has been listed in Bole', time: '3 hours ago', is_read: true, icon: Home, color: 'purple' },
        { id: 4, type: 'user', title: 'New User Registration', description: 'A new user has registered on the platform', time: '5 hours ago', is_read: true, icon: UserPlus, color: 'orange' },
        { id: 5, type: 'system', title: 'System Update', description: 'System maintenance scheduled for tonight', time: '1 day ago', is_read: true, icon: Bell, color: 'gray' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      const token = getToken()
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      toast.success('Marked as read')
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = getToken()
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id) => {
    try {
      const token = getToken()
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getIconColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      gray: 'bg-gray-100 text-gray-600'
    }
    return colors[color] || colors.gray
  }

  const formatTime = (timeString) => {
    return timeString
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500 mt-0.5">Stay updated with your platform activity</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Recent Notifications</h3>
          <span className="text-sm text-gray-500">
            {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications yet</p>
            <p className="text-sm text-gray-400">When you receive notifications, they will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const Icon = notif.icon
              return (
                <div
                  key={notif.id}
                  className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                    !notif.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notif.color)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                        {!notif.is_read && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">New</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{notif.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{notif.time}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      {!notif.is_read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications