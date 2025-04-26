import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
// Zustand stores
import useInvoiceStore from '../../stores/useInvoiceStore'

const InvoiceFetcher = () => {
  const location = useLocation()
  const { invoices, fetchInvoices } = useInvoiceStore()

  useEffect(() => {
    const paths = ['/invoices', '/dashboard']
    if (paths.includes(location.pathname)) {
      let filters = {}
      let ordering = 'name'
      let limit = null
      let offset = null

      if (location.pathname.includes('invoices')) {
        ordering = '-issued_date'
      }
      if (location.pathname.includes('dashboard')) {
        ordering = '-issued_date'
        limit = 5
      }

      fetchInvoices({ ...filters, ordering, limit, offset })
    }
  }, [location.pathname, invoices.length, fetchInvoices])

  return null
}

export default InvoiceFetcher
