// src/components/common/Button.jsx
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
    primary: 'bg-primary-800 hover:bg-primary-900 text-white shadow-md transition-all duration-200',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-md transition-all duration-200',
    outline: 'border-2 border-primary-800 text-primary-800 hover:bg-primary-50 transition-all duration-200',
    outlineSecondary: 'border-2 border-secondary-500 text-secondary-500 hover:bg-secondary-50 transition-all duration-200',
    danger: 'bg-error hover:bg-red-700 text-white transition-all duration-200',
    success: 'bg-success hover:bg-green-700 text-white transition-all duration-200',
    ghost: 'hover:bg-primary-50 text-primary-800 transition-all duration-200',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant]} ${sizes[size]} font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center ${className}`}
    >
      {loading && <Loader className="w-5 h-5 animate-spin" />}
      {!loading && Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  )
}

export default Button