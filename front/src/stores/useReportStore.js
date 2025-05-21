import { create } from 'zustand'
import axiosInstance from '../utils/axiosInstance'

const REPORT_API_URL = import.meta.env.VITE_API_URL + '/reports/'

const useReportStore = create((set) => ({
  reports: [],
  pagination: null,
  loading: false,
  error: null,

  fetchReports: async (params = {}) => {
    set({ loading: true })
    try {
      const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null))
      const queryParams = new URLSearchParams(cleanParams)
      if (params.ordering) queryParams.append('ordering', params.ordering)

      const response = await axiosInstance.get(`${REPORT_API_URL}?${queryParams}`)

      const isPaginated = 'results' in response.data
      const results = isPaginated ? response.data.results : response.data
      const pagination = isPaginated
        ? { count: response.data.count, next: response.data.next, previous: response.data.previous }
        : null

      set({
        reports: results,
        pagination,
        loading: false,
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createReport: async (report) => {
    try {
      const response = await axiosInstance.post(`${REPORT_API_URL}`, report)
      set((state) => ({ reports: [...state.reports, response.data] }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  updateReport: async (id, report) => {
    try {
      const response = await axiosInstance.patch(`${REPORT_API_URL}${id}/`, report)
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? response.data : r)),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  deleteReport: async (id) => {
    try {
      const response = await axiosInstance.delete(`${REPORT_API_URL}${id}/`)
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },
}))

export default useReportStore
