import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  isValidUsername,
  isValidEmail,
  isValidPassword,
  passwordsMatch,
} from '../../utils/validation'
import '../../styles/Auth.css'

const apiURL = process.env.REACT_APP_API_URL

const Register = () => {
  const navigate = useNavigate()
  const { register, loading } = useAuth()

  // Form fields
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Error messages
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Check availability of username and email with the backend
  const checkAvailability = async (field, value) => {
    try {
      const res = await fetch(`${apiURL}/users/check_availability/?${field}=${value}`)
      const data = await res.json()
      return data[`${field}_taken`] ? `${field} is already taken` : ''
    } catch (err) {
      return `Error checking ${field}`
    }
  }

  // Live validation
  useEffect(() => {
    const validate = async () => {
      const formatError = isValidUsername(username)
      const availabilityError = username ? await checkAvailability('username', username) : ''
      setErrors((prev) => ({
        ...prev,
        username: formatError || availabilityError,
      }))
    }
    if (username) validate()
  }, [username])

  useEffect(() => {
    const validate = async () => {
      const formatError = isValidEmail(email)
      const availabilityError = email ? await checkAvailability('email', email) : ''
      setErrors((prev) => ({
        ...prev,
        email: formatError || availabilityError,
      }))
    }
    if (email) validate()
  }, [email])

  useEffect(() => {
    const passwordError = isValidPassword(password)
    setErrors((prevErrors) =>
      prevErrors.password !== passwordError
        ? { ...prevErrors, password: passwordError }
        : prevErrors,
    )
  }, [password])

  useEffect(() => {
    const confirmPasswordError = passwordsMatch(password, confirmPassword)
    setErrors((prevErrors) =>
      prevErrors.confirmPassword !== confirmPasswordError
        ? { ...prevErrors, confirmPassword: confirmPasswordError }
        : prevErrors,
    )
  }, [confirmPassword, password])

  const isFormValid = useMemo(
    () =>
      !errors.username &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword &&
      username &&
      email &&
      password &&
      confirmPassword,
    [errors, username, email, password, confirmPassword],
  )

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    const isRegistered = await register(username, email, password)
    if (isRegistered) {
      navigate('/login')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            id="username"
            type="text"
            placeholder="Username"
            title="Username is required"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={errors.username ? 'invalid' : 'valid'}
            required
          />
          <p className="error-text">{errors.username && <>{errors.username}</>}</p>

          <input
            id="email"
            type="email"
            placeholder="Email"
            title="Email is required"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'invalid' : 'valid'}
            required
          />
          <p className="error-text">{errors.email && <>{errors.email}</>}</p>

          <input
            id="password"
            type="password"
            placeholder="Password"
            title="Password is required"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'invalid' : 'valid'}
            required
          />
          <p className="error-text">{errors.password && <>{errors.password}</>}</p>

          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            title="Password is required"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={errors.confirmPassword ? 'invalid' : 'valid'}
            required
          />
          <p className="error-text">{errors.confirmPassword && <>{errors.confirmPassword}</>}</p>

          <button type="submit" disabled={!isFormValid || loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="bottomline">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
