import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
// Zustand stores
import useReportStore from '../../stores/useReportStore'
// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Utils
import { getReportFilters } from '../../utils/getReportFilters'

const ReportFetcher = () => {
  const location = useLocation()
  const { modalState } = useGlobalContext()
  const { reports, fetchReports, fetchTasks, fetchParts } = useReportStore()

  // Fetch reports when the pathname changes
  useEffect(() => {
    const reportPaths = ['/report', '/dashboard', '/invoices']
    if (reportPaths.includes(location.pathname)) {
      const { filters, ordering, limit, offset } = getReportFilters(location.pathname)
      fetchReports({ ...filters, ordering, limit, offset })
    }
  }, [location.pathname, reports.length, fetchReports])

  // Automatically fetch data when the selectedItem changes
  useEffect(() => {
    const reportPaths = ['/report', '/dashboard', '/invoices']
    if (
      reportPaths.includes(location.pathname) &&
      modalState.itemType === 'Report' &&
      modalState.selectedItem?.id
    ) {
      fetchTasks(modalState.selectedItem.id)
      fetchParts(modalState.selectedItem.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState.selectedItem, modalState.itemType, location.pathname])

  return null
}

export default ReportFetcher
