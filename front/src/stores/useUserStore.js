import { create } from 'zustand'
import axiosInstance from '../utils/axiosInstance'

const USER_API_URL = process.env.REACT_APP_API_URL + '/users/'

const useUserStore = create((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async (params = {}, ordering = '') => {
    set({ loading: true })
    try {
      const queryParams = new URLSearchParams({ ...params })
      if (ordering) queryParams.append('ordering', ordering)

      const response = await axiosInstance.get(`${USER_API_URL}?${queryParams}`)
      set({ users: response.data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  updateOwner: async (id, userData) => {
    try {
      const response = await axiosInstance.patch(`${USER_API_URL}${id}/`, userData)
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? response.data : user)),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`${USER_API_URL}${id}/`)
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },
}))

export default useUserStore
