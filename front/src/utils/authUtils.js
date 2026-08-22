import axios from 'axios'
import { API_BASE_URL, setAxiosToken } from './axiosInstance'

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null

  try {
    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
      refresh: refreshToken,
    })

    const newAccessToken = response.data.access
    const newRefreshToken = response.data.refresh

    localStorage.setItem('token', newAccessToken)
    if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken)
    setAxiosToken(newAccessToken)

    return newAccessToken
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
}
