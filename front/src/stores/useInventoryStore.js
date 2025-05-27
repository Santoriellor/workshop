import { create } from 'zustand'
import axiosInstance from '../utils/axiosInstance'

const INVENTORY_API_URL = '/inventory/'

const useInventoryStore = create((set) => ({
  inventory: [],
  pagination: null,
  loading: false,
  error: null,

  fetchInventory: async (params = {}) => {
    set({ loading: true })
    try {
      const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null))
      const queryParams = new URLSearchParams(cleanParams)
      if (params.ordering) queryParams.append('ordering', params.ordering)

      const response = await axiosInstance.get(`${INVENTORY_API_URL}?${queryParams}`)

      const isPaginated = 'results' in response.data
      const results = isPaginated ? response.data.results : response.data
      const pagination = isPaginated
        ? { count: response.data.count, next: response.data.next, previous: response.data.previous }
        : null

      set({
        inventory: results,
        pagination,
        loading: false,
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createInventory: async (part) => {
    try {
      const response = await axiosInstance.post(INVENTORY_API_URL, part)
      set((state) => ({
        inventory: [...state.inventory, response.data],
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  updateInventory: async (id, partData) => {
    try {
      const response = await axiosInstance.patch(`${INVENTORY_API_URL}${id}/`, partData)
      set((state) => ({
        inventory: state.inventory.map((part) => (part.id === id ? response.data : part)),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  deleteInventory: async (id) => {
    try {
      const response = await axiosInstance.delete(`${INVENTORY_API_URL}${id}/`)
      set((state) => ({
        inventory: state.inventory.filter((part) => part.id !== id),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },
}))

export default useInventoryStore
