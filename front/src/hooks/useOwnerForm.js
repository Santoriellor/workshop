import { useState, useEffect, useMemo } from 'react'
import { isValidEmail, isTakenOwnerName, isValidPhone, isValidAddress } from '../utils/validation'

const initialErrors = {
  full_name: '',
  email: '',
  address: '',
  phone: '',
}

export const useOwnerForm = (initialData, owners, selectedItem) => {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState(initialErrors)

  // Memoize existing names to avoid recalculating on every render
  const existingOwnerNames = useMemo(() => {
    return owners
      .map((owner) => owner.full_name)
      .filter(
        (name) => !selectedItem || name.toLowerCase() !== selectedItem.full_name.toLowerCase(),
      )
  }, [owners, selectedItem])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  // Validation effects
  useEffect(() => {
    const fullNameError =
      data.full_name.trim() === ''
        ? 'This field is required.'
        : isTakenOwnerName(data.full_name, existingOwnerNames)
    setErrors((prevErrors) =>
      prevErrors.full_name !== fullNameError
        ? { ...prevErrors, full_name: fullNameError }
        : prevErrors,
    )
  }, [data.full_name, existingOwnerNames])

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

  return { data, setData, errors, handleChange, isValid }
}
