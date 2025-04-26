import { create } from 'zustand'
import axiosInstance from '../utils/axiosInstance'

const TASKTEMPLATE_API_URL = process.env.REACT_APP_API_URL + '/task-templates/'

const useTaskTemplateStore = create((set) => ({
  taskTemplates: [],
  loading: false,
  error: null,

  fetchTaskTemplates: async (params = {}, ordering = '') => {
    set({ loading: true })
    try {
      const queryParams = new URLSearchParams({ ...params })
      if (ordering) queryParams.append('ordering', ordering)

      const response = await axiosInstance.get(`${TASKTEMPLATE_API_URL}?${queryParams}`)
      set({ taskTemplates: response.data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createTaskTemplate: async (task) => {
    try {
      const response = await axiosInstance.post(TASKTEMPLATE_API_URL, task)
      set((state) => ({
        taskTemplates: [...state.taskTemplates, response.data],
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  updateTaskTemplate: async (id, taskData) => {
    try {
      const response = await axiosInstance.patch(`${TASKTEMPLATE_API_URL}${id}/`, taskData)
      set((state) => ({
        taskTemplates: state.taskTemplates.map((task) => (task.id === id ? response.data : task)),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  deleteTaskTemplate: async (id) => {
    try {
      const response = await axiosInstance.delete(`${TASKTEMPLATE_API_URL}${id}/`)
      set((state) => ({
        taskTemplates: state.taskTemplates.filter((task) => task.id !== id),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },
}))

export default useTaskTemplateStore
