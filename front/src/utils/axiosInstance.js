import axios from 'axios'
import { refreshToken, logout } from './authUtils'

/**
 * The one base URL for every call to this API. Exported so nothing else has to
 * read import.meta.env directly - authUtils and the registration form used to.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

// Set the token dynamically (after login, or after a refresh).
export const setAxiosToken = (token) => {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    // `_retry` is what stops this from recursing. The replay below goes through
    // this same interceptor, so without the flag a request that keeps returning
    // 401 refreshes and replays forever.
    if (response && response.status === 401 && config && !config._retry) {
      config._retry = true

      const newToken = await refreshToken()
      if (newToken) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newToken}` }
        return axiosInstance(config)
      }

      logout()
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
