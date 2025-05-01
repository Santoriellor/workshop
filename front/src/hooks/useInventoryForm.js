import { useState, useEffect, useMemo } from 'react'
import { isValidReferenceCode, isValidQuantityInStock, isValidPrice } from '../utils/validation'

const initialErrors = {
  name: '',
  reference_code: '',
  category: '',
  quantity_in_stock: '',
  unit_price: '',
}

export const useInventoryForm = (initialData, inventory, selectedItem) => {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState(initialErrors)

  // Memoize existing names to avoid recalculating on every render
  const existingReferenceCodes = useMemo(() => {
    return inventory
      .map((part) => part.reference_code)
      .filter(
        (reference) =>
          !selectedItem || reference.toLowerCase() !== selectedItem.reference_code.toLowerCase(),
      )
  }, [inventory, selectedItem])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  // Validation effects
  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      name: data.name ? '' : 'This field is required.',
    }))
  }, [data.name])

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      category: data.category ? '' : 'This field is required.',
    }))
  }, [data.category])

  useEffect(() => {
    const referenceCodeError =
      data.reference_code.trim() === ''
        ? 'This field is required.'
        : isValidReferenceCode(data.reference_code, existingReferenceCodes)
    setErrors((prevErrors) =>
      prevErrors.reference_code !== referenceCodeError
        ? { ...prevErrors, reference_code: referenceCodeError }
        : prevErrors,
    )
  }, [data.reference_code, existingReferenceCodes])

  useEffect(() => {
    const quantityError =
      data.quantity_in_stock.toString().trim() === ''
        ? 'This field is required.'
        : isValidQuantityInStock(data.quantity_in_stock.toString())
    setErrors((prevErrors) =>
      prevErrors.quantity_in_stock !== quantityError
        ? { ...prevErrors, quantity_in_stock: quantityError }
        : prevErrors,
    )
  }, [data.quantity_in_stock])

  useEffect(() => {
    const priceError =
      data.unit_price.toString().trim() === ''
        ? 'This field is required.'
        : isValidPrice(data.unit_price.toString())
    setErrors((prevErrors) =>
      prevErrors.unit_price !== priceError ? { ...prevErrors, unit_price: priceError } : prevErrors,
    )
  }, [data.unit_price])

  // isValid should only update when either data or errors change
  const isValid = useMemo(
    () =>
      Object.values(errors).every((err) => !err) && Object.values(data).every((val) => val !== ''),
    [errors, data],
  )

  return { data, setData, errors, handleChange, isValid }
}
