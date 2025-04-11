import { useState } from 'react'
import { useAxios } from './useAxios'
// Contexts
import { useAuth } from '../contexts/AuthContext'

const useCRUD = (apiEndpoint, parentResource = null, itemId = null) => {
  const { authenticatedUser } = useAuth()

  const axiosInstance = useAxios()
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({
    next: null,
    previous: null,
    count: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Construct URL dynamically
  const baseURL =
    parentResource && itemId ? `${parentResource}/${itemId}/${apiEndpoint}/` : `${apiEndpoint}/`

  // Centralized error handling
  const handleError = (err) => {
    console.error(`Error in ${apiEndpoint}:`, err.message, err.response?.data || '')
    setError(err.message || 'An error occurred')
  }

  // Fetch all items
  const fetchData = async (filters = {}, sort = '', limit = null, offset = null) => {
    if (!authenticatedUser) return

    if (parentResource && !itemId) {
      if (data.length > 0) setData([]) // Clear state when no itemId is selected
      return
    }
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      if (sort) params.append('ordering', sort)
      if (limit !== null) params.append('limit', limit)
      if (offset !== null) params.append('offset', offset)

      const response = await axiosInstance.get(`${baseURL}?${params.toString()}`)

      let newData = 'results' in response.data ? response.data.results : response.data

      let newPagination = {
        next: response.data.next || null,
        previous: response.data.previous || null,
        count: 'results' in response.data ? response.data.count : newData.length,
      }

      // Update state only if data has changed
      if (JSON.stringify(newData) !== JSON.stringify(data)) {
        setData(newData)
      }
      if (JSON.stringify(newPagination) !== JSON.stringify(pagination)) {
        setPagination(newPagination)
      }

      return response.data
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  // Create an item
  const createItem = async (itemData) => {
    if (!authenticatedUser) return
    try {
      setLoading(true)
      const response = await axiosInstance.post(`${apiEndpoint}/`, itemData)
      setData((prev) => [...prev, response.data])
      return response.data
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  // Update an item
  const updateItem = async (itemId, updatedFields) => {
    if (!authenticatedUser) return
    try {
      setLoading(true)
      const response = await axiosInstance.patch(`${apiEndpoint}/${itemId}/`, updatedFields)
      setData((prev) => prev.map((item) => (item.id === itemId ? response.data : item)))
      return response.data
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  // Delete an item
  const deleteItem = async (itemId) => {
    if (!authenticatedUser) return
    try {
      setLoading(true)
      const response = await axiosInstance.delete(`${apiEndpoint}/${itemId}/`)
      setData((prev) => prev.filter((item) => item.id !== itemId))
      return response
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    setData,
    fetchData,
    pagination,
    createItem,
    updateItem,
    deleteItem,
    loading,
    error,
  }
}

export default useCRUD
