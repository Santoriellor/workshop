import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
// Utils
import { setAxiosToken } from '../utils/axiosInstance'
import { logout as utilsLogout } from '../utils/authUtils'

const apiURL = process.env.REACT_APP_API_URL
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [authenticatedUser, setAuthenticatedUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const navigate = useNavigate()

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${apiURL}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAuthenticatedUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      logout() // Log out if the token is invalid
    }
  }

  // Check for a token in localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUserData(token).finally(() => setLoadingAuth(false))
      // Set the token for axios headers
      setAxiosToken(token)
    } else {
      setLoadingAuth(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email, password) => {
    setLoadingAuth(true)
    try {
      const response = await axios.post(`${apiURL}/login/`, {
        email,
        password,
      })

      // Store tokens
      localStorage.setItem('token', response.data.access)
      localStorage.setItem('refreshToken', response.data.refresh)

      // Set the token for axios headers
      setAxiosToken(response.data.access)

      // Fetch user data
      await fetchUserData(response.data.access)

      // Alert the user on success
      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'You have been logged in successfully!',
      })

      return true
    } catch (error) {
      console.error('Login failed:', error)

      // Alert the user on error
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: 'Invalid email or password. Please try again.',
      })

      return false
    } finally {
      setLoadingAuth(false)
    }
  }

  const logout = () => {
    utilsLogout()
    setAuthenticatedUser(null)
    navigate('/login')
  }

  const register = async (username, email, password) => {
    setLoadingAuth(true)
    try {
      // Send registration data to the backend
      await axios.post(`${apiURL}/register/`, {
        username,
        email,
        password,
      })

      // Alert the user on success
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: 'You have been registered successfully! Please log in.',
      })

      // Redirect to the login page
      navigate('/login')
    } catch (error) {
      console.error('Registration failed:', error)

      // Alert the user on error
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text:
          error.response?.data?.error || 'An error occurred during registration. Please try again.',
      })
    } finally {
      setLoadingAuth(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        authenticatedUser,
        login,
        logout,
        register,
        loadingAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
