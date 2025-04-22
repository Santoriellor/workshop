import { create } from 'zustand'
import axiosInstance from '../utils/axiosInstance'

const REPORT_API_URL = process.env.REACT_APP_API_URL + '/reports/'
const TASK_API_URL = process.env.REACT_APP_API_URL + '/tasks/'
const PART_API_URL = process.env.REACT_APP_API_URL + '/parts/'

const useReportStore = create((set, get) => ({
  reports: [],
  tasks: [],
  parts: [],
  pagination: null,
  loading: false,
  loadingTasks: false,
  loadingParts: false,
  error: null,

  fetchReports: async (params = {}) => {
    set({ loading: true })
    try {
      const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null))
      const queryParams = new URLSearchParams(cleanParams)
      if (params.ordering) queryParams.append('ordering', params.ordering)
      // const queryParams = new URLSearchParams(params).toString()

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

  fetchTasks: async (reportId) => {
    set({ loadingTasks: true })
    try {
      const response = await axiosInstance.get(`${REPORT_API_URL}${reportId}/tasks/`)
      set({ tasks: response.data, loadingTasks: false })
    } catch (error) {
      set({ error: error.message, loadingTasks: false })
    }
  },

  createTask: async (task) => {
    try {
      const response = await axiosInstance.post(`${TASK_API_URL}`, task)
      set((state) => ({ tasks: [...state.tasks, response.data] }))
      return response.data
    } catch (error) {
      set({ error: error.message })
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const response = await axiosInstance.patch(`${TASK_API_URL}${taskId}/`, taskData)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? response.data : t)),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
    }
  },

  deleteTask: async (taskId) => {
    try {
      const response = await axiosInstance.delete(`${TASK_API_URL}${taskId}/`)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
    }
  },

  // Parts
  fetchParts: async (reportId) => {
    set({ loadingParts: true })
    try {
      const response = await axiosInstance.get(`${REPORT_API_URL}${reportId}/parts/`)
      set({ parts: response.data, loadingParts: false })
    } catch (error) {
      set({ error: error.message, loadingParts: false })
    }
  },

  createPart: async (part) => {
    const response = await axiosInstance.post(`${PART_API_URL}`, part)
    set((state) => ({ parts: [...state.parts, response.data] }))
    return response.data
  },

  updatePart: async (partId, partData) => {
    const response = await axiosInstance.patch(`${PART_API_URL}${partId}/`, partData)
    set((state) => ({
      parts: state.parts.map((p) => (p.id === partId ? response.data : p)),
    }))
    return response.data
  },

  deletePart: async (partId) => {
    await axiosInstance.delete(`${PART_API_URL}${partId}/`)
    set((state) => ({
      parts: state.parts.filter((p) => p.id !== partId),
    }))
  },
}))

export default useReportStore
