import { useState, useEffect, useMemo } from 'react'
import {
  isValidEmail,
  isTakenOwnerName,
  isValidName,
  isValidPhone,
  isValidAddress,
} from '../utils/validation'

const initialErrors = {
  first_name: '',
  last_name: '',
  email: '',
  address: '',
  phone: '',
}

export const useOwnerForm = (initialData, owners, selectedItem) => {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState(initialErrors)
  const [touched, setTouched] = useState({})

  // Memoize existing names to avoid recalculating on every render
  const existingOwnerFullNames = useMemo(() => {
    return owners
      .filter(
        (owner) =>
          !selectedItem ||
          `${owner.first_name} ${owner.last_name}`.toLowerCase() !==
            `${selectedItem.first_name} ${selectedItem.last_name}`.toLowerCase(),
      )
      .map((owner) => `${owner.first_name} ${owner.last_name}`.toLowerCase())
  }, [owners, selectedItem])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  // Validation effects
  useEffect(() => {
    const firstName = data.first_name.trim()
    const lastName = data.last_name.trim()

    let firstNameError = ''
    let lastNameError = ''

    // Empty check
    if (!firstName) {
      firstNameError = 'This field is required.'
    }
    if (!lastName) {
      lastNameError = 'This field is required.'
    }

    // Format check
    if (!firstNameError) {
      const formatError = isValidName(firstName)
      if (formatError) {
        firstNameError = formatError
      }
    }
    if (!lastNameError) {
      const formatError = isValidName(lastName)
      if (formatError) {
        lastNameError = formatError
      }
    }

    // Duplication check only if both fields are valid so far
    if (!firstNameError && !lastNameError) {
      const duplicateError = isTakenOwnerName(firstName, lastName, existingOwnerFullNames)
      if (duplicateError) {
        firstNameError = duplicateError
        lastNameError = duplicateError
      }
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      first_name: firstNameError,
      last_name: lastNameError,
    }))
  }, [data.first_name, data.last_name, existingOwnerFullNames])

  useEffect(() => {
    const emailError =
      data.email.trim() === '' ? 'This field is required.' : isValidEmail(data.email)
    setErrors((prevErrors) =>
      prevErrors.email !== emailError ? { ...prevErrors, email: emailError } : prevErrors,
    )
  }, [data.email])

  useEffect(() => {
    const addressError =
      data.address.trim() === '' ? 'This field is required.' : isValidAddress(data.address)
    setErrors((prevErrors) =>
      prevErrors.address !== addressError ? { ...prevErrors, address: addressError } : prevErrors,
    )
  }, [data.address])

  useEffect(() => {
    const phoneError =
      data.phone.trim() === '' ? 'This field is required.' : isValidPhone(data.phone)
    setErrors((prevErrors) =>
      prevErrors.phone !== phoneError ? { ...prevErrors, phone: phoneError } : prevErrors,
    )
  }, [data.phone])

  // isValid should only update when either data or errors change
  const isValid = useMemo(
    () =>
      Object.values(errors).every((err) => !err) &&
      Object.values(data).every((val) => val !== '' && val !== null),
    [errors, data],
  )

  return { data, setData, errors, touched, handleChange, handleBlur, isValid }
}
