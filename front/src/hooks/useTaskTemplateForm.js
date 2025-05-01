import { useState, useEffect, useMemo } from 'react'
import { isTakenTaskName, isValidPrice } from '../utils/validation'

const initialErrors = {
  name: 'This field is required.',
  description: 'This field is required.',
  price: 'This field is required.',
}

export const useTaskTemplateForm = (initialData, taskTemplates, selectedItem) => {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState(initialErrors)

  // Memoize existing names to avoid recalculating on every render
  const existingNames = useMemo(() => {
    return taskTemplates
      .map((t) => t.name)
      .filter((name) => !selectedItem || name.toLowerCase() !== selectedItem.name.toLowerCase())
  }, [taskTemplates, selectedItem])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  // Validation effects
  useEffect(() => {
    const error =
      data.name.trim() === ''
        ? 'This field is required.'
        : isTakenTaskName(data.name, existingNames)
    setErrors((prev) => ({ ...prev, name: error }))
  }, [data.name, existingNames])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      description: data.description ? '' : 'This field is required.',
    }))
  }, [data.description])

  useEffect(() => {
    const error = data.price.trim() === '' ? 'This field is required.' : isValidPrice(data.price)
    setErrors((prev) => ({ ...prev, price: error }))
  }, [data.price])

  // isValid should only update when either data or errors change
  const isValid = useMemo(
    () =>
      Object.values(errors).every((err) => !err) && Object.values(data).every((val) => val !== ''),
    [errors, data],
  )

  return { data, setData, errors, handleChange, isValid }
}
