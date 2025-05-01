import { useState, useEffect, useMemo } from 'react'
import { isValidQuantityInStock } from '../utils/validation'

const initialErrors = {
  vehicle: '',
  status: '',
  tasks: '',
  parts: '',
  part_quantity: '',
}

export const useReportForm = (initialData, taskIds, partsUsed, quantityPart) => {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState(initialErrors)

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]: name === 'vehicle' ? Number(value) : value,
    }))
  }

  // Validation effects
  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      vehicle: data.vehicle ? '' : 'This field is required.',
    }))
  }, [data.vehicle])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      tasks: taskIds.length ? '' : 'At least one task is required.',
    }))
  }, [taskIds])

  useEffect(() => {
    let error = ''
    if (!quantityPart || quantityPart === '0' || quantityPart.toString().trim() === '') {
      error = 'The quantity is required to add a part.'
    } else {
      const result = isValidQuantityInStock(quantityPart.toString())
      error = result === true ? '' : result
    }

    setErrors((prev) => (prev.part_quantity !== error ? { ...prev, part_quantity: error } : prev))
  }, [quantityPart])

  // isValid should only update when either data or errors change
  const isValid = useMemo(() => {
    const requiredFields = ['vehicle', 'user', 'status']
    const hasNoErrors = Object.values(errors).every((err) => !err)
    const hasAllRequiredFields = requiredFields.every((key) => data[key] !== '')

    return hasNoErrors && hasAllRequiredFields
  }, [errors, data])

  return { data, errors, handleChange, isValid }
}
