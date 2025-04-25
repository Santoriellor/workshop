import { Toast } from '../utils/sweetalert'

const withSuccessAlert = (fn, successMessage, customMessage = null) => {
  return async (...args) => {
    try {
      const result = await fn(...args)

      const messageToShow =
        result.status === 'exported'
          ? customMessage || 'Report exported successfully!'
          : successMessage

      Toast.fire('Success', messageToShow, 'success')

      return result
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }
}

export default withSuccessAlert
