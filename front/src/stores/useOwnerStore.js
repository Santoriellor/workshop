import { create } from 'zustand'
import axiosInstance from '../utils/axiosInstance'

const OWNER_API_URL = import.meta.env.VITE_API_URL + '/owners/'

const useOwnerStore = create((set) => ({
  owners: [],
  loading: false,
  error: null,

  fetchOwners: async (params = {}, ordering = '') => {
    set({ loading: true })
    try {
      const queryParams = new URLSearchParams({ ...params })
      if (ordering) queryParams.append('ordering', ordering)

      const response = await axiosInstance.get(`${OWNER_API_URL}?${queryParams}`)
      set({ owners: response.data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createOwner: async (owner) => {
    try {
      const response = await axiosInstance.post(OWNER_API_URL, owner)
      set((state) => ({
        owners: [...state.owners, response.data],
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  updateOwner: async (id, ownerData) => {
    try {
      const response = await axiosInstance.patch(`${OWNER_API_URL}${id}/`, ownerData)
      set((state) => ({
        owners: state.owners.map((owner) => (owner.id === id ? response.data : owner)),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  deleteOwner: async (id) => {
    try {
      const response = await axiosInstance.delete(`${OWNER_API_URL}${id}/`)
      set((state) => ({
        owners: state.owners.filter((owner) => owner.id !== id),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },
}))

export default useOwnerStore
