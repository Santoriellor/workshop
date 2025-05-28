import axios from 'axios'
import { refreshToken, logout } from './authUtils'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Set token dynamically (e.g., after login or token refresh)
export const setAxiosToken = (token) => {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Add response interceptor to handle token refresh on 401 errors
axiosInstance.interceptors.response.use(
  (response) => response, // If the request is successful, return the response
  async (error) => {
    const { response, config } = error
    if (response && response.status === 401) {
      // If a 401 error occurs, attempt to refresh the token
      const newToken = await refreshToken() // Call the refreshToken function
      if (newToken) {
        // If refresh successful, retry the failed request with the new token
        config.headers['Authorization'] = `Bearer ${newToken}`
        return axiosInstance(config) // Retry the original request
      } else {
        // If token refresh fails, log the user out
        logout()
      }
    }
    return Promise.reject(error) // If the error is not related to auth, reject the promise
  },
)

export default axiosInstance
