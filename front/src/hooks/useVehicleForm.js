import { useState, useEffect, useMemo } from 'react'
import { isValidOrTakenLicensePlate, isValidYear } from '../utils/validation'

const initialErrors = {
  brand: 'Please select a brand.',
  model: 'Please select a model.',
  license_plate: 'This field is required.',
  owner: 'This field is required.',
}

export const useVehicleForm = (initialData, vehicles, selectedItem) => {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState(initialErrors)

  // Memoize existing plates to avoid recalculating on every render
  const existingPlates = useMemo(() => {
    return vehicles
      .map((v) => v.license_plate)
      .filter(
        (plate) =>
          !selectedItem || plate.toLowerCase() !== selectedItem.license_plate?.toLowerCase(),
      )
  }, [vehicles, selectedItem])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]:
        name === 'owner' ? Number(value) : name === 'license_plate' ? value.toUpperCase() : value,
    }))
  }

  const handleBrandChange = (e) => {
    const { value } = e.target
    setData((prev) => ({
      ...prev,
      brand: value,
      model: '', // Reset model when brand changes
    }))
  }

  // Validation effects
  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      brand: data.brand ? '' : 'This field is required.',
    }))
  }, [data.brand])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      model: data.model ? '' : 'This field is required.',
    }))
  }, [data.model])

  useEffect(() => {
    const yearError = data.year === '' ? 'This field is required.' : isValidYear(data.year)
    setErrors((prev) => ({
      ...prev,
      year: yearError,
    }))
  }, [data.year])

  useEffect(() => {
    const licenseError = isValidOrTakenLicensePlate(data.license_plate, existingPlates)
    setErrors((prev) => ({
      ...prev,
      license_plate: licenseError,
    }))
  }, [data.license_plate, existingPlates])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      owner: data.owner ? '' : 'This field is required.',
    }))
  }, [data.owner])

  // isValid should only update when either data or errors change
  const isValid = useMemo(
    () =>
      Object.values(errors).every((err) => !err) &&
      Object.values(data).every((val) => val !== '' && val !== null),
    [errors, data],
  )

  return { data, setData, errors, handleChange, handleBrandChange, isValid }
}
