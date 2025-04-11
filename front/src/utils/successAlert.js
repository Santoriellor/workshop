import { Toast } from '../utils/sweetalert'

const withSuccessAlert = (fn, successMessage, customMessage = null) => {
  return async (...args) => {
    try {
      const result = await fn(...args)

      // Check if the result contains a 'status' field, and if it's 'exported'
      if (result.status === 'exported') {
        Toast.fire('Success', customMessage, 'success')
      } else {
        Toast.fire('Success', successMessage, 'success')
      }

      return result
    } catch (error) {
      console.error('Error:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    }
  }
}

export default withSuccessAlert
