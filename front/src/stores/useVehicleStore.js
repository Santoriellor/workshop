import { create } from 'zustand'
import axiosInstance from '../utils/axiosInstance'

const VEHICLE_API_URL = '/vehicles/'

const useVehicleStore = create((set) => ({
  vehicles: [],
  selectedVehicle: null,
  loading: false,
  error: null,

  fetchVehicles: async (params = {}, ordering = '') => {
    set({ loading: true })
    try {
      const queryParams = new URLSearchParams({ ...params })
      if (ordering) queryParams.append('ordering', ordering)

      const response = await axiosInstance.get(`${VEHICLE_API_URL}?${queryParams}`)
      set({ vehicles: response.data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createVehicle: async (vehicle) => {
    try {
      const response = await axiosInstance.post(VEHICLE_API_URL, vehicle)
      set((state) => ({
        vehicles: [...state.vehicles, response.data],
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await axiosInstance.patch(`${VEHICLE_API_URL}${id}/`, vehicleData)
      set((state) => ({
        vehicles: state.vehicles.map((vehicle) => (vehicle.id === id ? response.data : vehicle)),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  deleteVehicle: async (id) => {
    try {
      const response = await axiosInstance.delete(`${VEHICLE_API_URL}${id}/`)
      set((state) => ({
        vehicles: state.vehicles.filter((vehicle) => vehicle.id !== id),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
}))

export default useVehicleStore
