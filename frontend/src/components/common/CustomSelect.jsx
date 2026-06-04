// src/components/common/CustomSelect.jsx - UPDATED VERSION
import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const CustomSelect = ({ value, onChange, options, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)
  const [dropdownPosition, setDropdownPosition] = useState('bottom')

  // Calculate if dropdown should open above or below
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      // If less than 200px below, open above
      setDropdownPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom')
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-xl flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition shadow-sm"
      >
        <span className={selectedOption ? 'text-gray-900 text-sm' : 'text-gray-500 text-sm'}>
          {selectedOption ? selectedOption.label : placeholder || 'Select option'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Invisible backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            style={{ background: 'transparent' }}
          />
          
          {/* Dropdown menu - positioned relative to viewport to avoid modal clipping */}
          <div 
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto"
            style={{
              width: selectRef.current ? selectRef.current.offsetWidth : 'auto',
              left: selectRef.current ? selectRef.current.getBoundingClientRect().left : 'auto',
              [dropdownPosition === 'top' ? 'bottom' : 'top']: selectRef.current 
                ? dropdownPosition === 'top'
                  ? window.innerHeight - selectRef.current.getBoundingClientRect().top + 8
                  : selectRef.current.getBoundingClientRect().bottom + 8
                : 'auto'
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition ${
                  value === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CustomSelect