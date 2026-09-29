export const VALIDATION_RULES = {
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`
    }
    return null
  },
  
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (value && !emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },
  
  phone: (value) => {
    const phoneRegex = /^(\+251|0)[0-9]{9}$/
    if (value && !phoneRegex.test(value)) {
      return 'Please enter a valid Ethiopian phone number (e.g., 0912345678 or +251912345678)'
    }
    return null
  },
  
  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`
    }
    return null
  },
  
  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Must be at most ${max} characters`
    }
    return null
  },
  
  min: (min) => (value) => {
    if (value && parseFloat(value) < min) {
      return `Must be at least ${min}`
    }
    return null
  },
  
  max: (max) => (value) => {
    if (value && parseFloat(value) > max) {
      return `Must be at most ${max}`
    }
    return null
  },
  
  pattern: (regex, message) => (value) => {
    if (value && !regex.test(value)) {
      return message
    }
    return null
  },
  
  match: (fieldName, otherField) => (value, formValues) => {
    if (value !== formValues[otherField]) {
      return `${fieldName} does not match`
    }
    return null
  },
}

export default VALIDATION_RULES
