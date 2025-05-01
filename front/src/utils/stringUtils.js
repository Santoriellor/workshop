export function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function truncateText(text, maxLength = 20) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

export function formatQuantity(value) {
  // Remove leading zero if the second character is not a dot
  if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
    value = value.slice(1)
  }
  // Prevent leading dots by converting ".5" to "0.5"
  if (value.startsWith('.')) {
    value = '0' + value
  }

  // Allow only numbers with up to 2 decimal places
  if (/^\d*\.?\d{0,2}$/.test(value)) {
    return value
  }

  return null
}
