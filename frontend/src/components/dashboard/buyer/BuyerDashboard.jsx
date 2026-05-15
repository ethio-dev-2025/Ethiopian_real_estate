import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Heart, MessageCircle, ArrowRight
} from 'lucide-react'

const BuyerDashboard = () => {
  const navigate = useNavigate()
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('buyer_saved_properties')
    if (saved) {
      try {
        const savedProps = JSON.parse(saved)
        setSavedCount(savedProps.length)
      } catch (e) {}
    }
  }, [])

  const quickActions = [
    {
      title: 'Start Exploring',
      description: 'Browse thousands of properties',
      icon: Search,
      gradient: 'from-blue-500 to-blue-600',
      action: () => navigate('/dashboard/buyer/properties'),
      stat: 'Find your dream home'
    },
    {
      title: 'Your Favorites',
      description: 'Properties you\'ve saved',
      icon: Heart,
      gradient: 'from-rose-500 to-rose-600',
      action: () => navigate('/dashboard/buyer/saved'),
      stat: `${savedCount} saved properties`
    },
    {
      title: 'Messages',
      description: 'Chat with property owners',
      icon: MessageCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      action: () => navigate('/dashboard/buyer/messages'),
      stat: 'Start a conversation'
    }
  ]

  return (
    <div>
      {/* MAXIMIZED CARDS - Full width with flex distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <div
              key={index}
              onClick={action.action}
              className={`bg-gradient-to-r ${action.gradient} rounded-xl p-5 text-white cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{action.title}</h3>
                  <p className="text-white/80 text-sm mt-0.5">{action.description}</p>
                  <p className="text-sm font-medium mt-2 text-white/90">{action.stat}</p>
                  <div className="flex items-center gap-1 mt-3 text-sm font-medium text-white/80">
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BuyerDashboard