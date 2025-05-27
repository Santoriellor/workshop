import { create } from 'zustand'
import axiosInstance from '../utils/axiosInstance'

const INVOICE_API_URL = '/invoices/'

const useInvoiceStore = create((set) => ({
  invoices: [],
  pagination: null,
  loading: false,
  error: null,

  fetchInvoices: async (params = {}) => {
    set({ loading: true })
    try {
      const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null))
      const queryParams = new URLSearchParams(cleanParams)
      if (params.ordering) queryParams.append('ordering', params.ordering)

      const response = await axiosInstance.get(`${INVOICE_API_URL}?${queryParams}`)

      const isPaginated = 'results' in response.data
      const results = isPaginated ? response.data.results : response.data
      const pagination = isPaginated
        ? { count: response.data.count, next: response.data.next, previous: response.data.previous }
        : null

      set({
        invoices: results,
        pagination,
        loading: false,
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createInvoice: async (invoice) => {
    try {
      const response = await axiosInstance.post(INVOICE_API_URL, invoice)
      set((state) => ({
        invoices: [...state.invoices, response.data],
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  updateInvoice: async (id, invoice) => {
    try {
      const response = await axiosInstance.patch(`${INVOICE_API_URL}${id}/`, invoice)
      set((state) => ({
        invoices: state.invoices.map((invoice) => (invoice.id === id ? response.data : invoice)),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  deleteInvoice: async (id) => {
    try {
      const response = await axiosInstance.delete(`${INVOICE_API_URL}${id}/`)
      set((state) => ({
        invoices: state.invoices.filter((invoice) => invoice.id !== id),
      }))
      return response.data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },
}))

export default useInvoiceStore
