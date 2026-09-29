// src/components/common/Loader.jsx
import React from 'react'

const Loader = ({ size = 'md', color = 'primary', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-secondary-500',
    success: 'border-success',
    white: 'border-white'
  }

  const spinner = (
    <div className={`${sizeClasses[size]} border-4 border-t-transparent ${colorClasses[color]} rounded-full animate-spin`} />
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center py-8">
      {spinner}
    </div>
  )
}

export default Loader