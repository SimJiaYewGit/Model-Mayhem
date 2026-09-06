/**
 * Utility functions for Agent Arena
 */

/**
 * Format a number with leading zeros
 */
export function padNumber(num, size = 2) {
  return num.toString().padStart(size, '0')
}

/**
 * Clamp a number between min and max
 */
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max)
}

/**
 * Calculate percentage
 */
export function percentage(current, max) {
  if (max === 0) return 0
  return Math.round((current / max) * 100)
}

/**
 * Get color based on percentage (red to green gradient)
 */
export function getHealthColor(percentage) {
  if (percentage > 60) return '#4ade80' // green
  if (percentage > 30) return '#fbbf24' // yellow
  return '#f87171' // red
}

/**
 * Get color based on energy level (blue gradient)
 */
export function getEnergyColor(percentage) {
  if (percentage > 60) return '#60a5fa' // light blue
  if (percentage > 30) return '#3b82f6' // blue
  return '#1d4ed8' // dark blue
}

/**
 * Format time in seconds from ticks
 */
export function formatTime(ticks, tickRate = 1000) {
  const totalSeconds = Math.floor((ticks * tickRate) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${padNumber(minutes)}:${padNumber(seconds)}`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Random choice from array
 */
export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffle(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Local storage helpers
 */
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return defaultValue
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Error writing to localStorage:', error)
      return false
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from localStorage:', error)
      return false
    }
  }
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Parse JSON safely
 */
export function safeJsonParse(json, defaultValue = null) {
  try {
    return JSON.parse(json)
  } catch (error) {
    console.warn('Failed to parse JSON:', error)
    return defaultValue
  }
}

/**
 * Stringify JSON safely
 */
export function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj)
  } catch (error) {
    console.error('Failed to stringify JSON:', error)
    return defaultValue
  }
}
