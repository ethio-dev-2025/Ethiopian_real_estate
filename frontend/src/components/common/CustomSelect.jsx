// src/components/common/CustomSelect.jsx
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

const CustomSelect = ({ value, onChange, options, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false })

  const updateDropdownPosition = () => {
    if (!buttonRef.current) return
    
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = 280
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight
    const width = rect.width
    
    let top, bottom
    if (openUpward) {
      bottom = window.innerHeight - rect.top + 8
      top = 'auto'
    } else {
      top = rect.bottom + 8
      bottom = 'auto'
    }
    
    let left = rect.left
    if (left + width > window.innerWidth - 16) {
      left = window.innerWidth - width - 16
    }
    if (left < 16) {
      left = 16
    }
    
    setDropdownPosition({ top, bottom, left, width, openUpward })
  }

  useEffect(() => {
    if (!isOpen) return
    
    updateDropdownPosition()
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    document.body.style.overflow = 'hidden'
    
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  const dropdownStyle = {
    position: 'fixed',
    zIndex: 99999,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
    maxHeight: '280px',
    overflowY: 'auto',
    width: dropdownPosition.width + 'px',
    left: dropdownPosition.left + 'px'
  }

  if (dropdownPosition.openUpward) {
    dropdownStyle.bottom = dropdownPosition.bottom + 'px'
  } else {
    dropdownStyle.top = dropdownPosition.top + 'px'
  }

  const handleSelectChange = (newValue) => {
    console.log('CustomSelect onChange called with:', newValue)
    onChange(newValue)
    setIsOpen(false)
  }

  return (
    <>
      <div className={`relative ${className}`} ref={buttonRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2.5 text-left bg-white border border-border-light rounded-lg flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-400 transition shadow-sm min-h-[44px]"
        >
          <span className={selectedOption ? 'text-text-primary text-sm' : 'text-text-muted text-sm'}>
            {selectedOption ? selectedOption.label : placeholder || 'Select option'}
          </span>
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {isOpen && createPortal(
        <div style={dropdownStyle} className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelectChange(option.value)}
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition text-sm min-h-[44px] ${
                  value === option.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-text-secondary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default CustomSelect