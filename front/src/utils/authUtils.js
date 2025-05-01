import axios from 'axios'
import { setAxiosToken } from './axiosInstance'

const apiURL = process.env.REACT_APP_API_URL

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null

  try {
    const response = await axios.post(`${apiURL}/token/refresh/`, {
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
  // window.location.href = '/login' // fallback way to redirect
}
