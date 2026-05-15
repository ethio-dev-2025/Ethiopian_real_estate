import React from 'react'
import { Loader } from 'lucide-react'

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon = null
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg',
    secondary: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant]} ${sizes[size]} rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2 justify-center ${className}`}
    >
      {loading && <Loader className="w-5 h-5 animate-spin" />}
      {!loading && Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  )
}

export default Button