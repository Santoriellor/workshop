import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
})

// Set token dynamically (e.g., after login or token refresh)
export const setAxiosToken = (token) => {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Add response interceptor if needed
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: Retry logic, logout, etc.
    return Promise.reject(error)
  },
)

export default axiosInstance
