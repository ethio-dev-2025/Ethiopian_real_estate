import React, { memo } from 'react'

const StatsCard = memo(({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300`}>
      <div className="flex justify-between items-start mb-3">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Icon className="w-6 h-6" /></div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm opacity-80 mt-1">{title}</p>
    </div>
  )
})

StatsCard.displayName = 'StatsCard'

export default StatsCard