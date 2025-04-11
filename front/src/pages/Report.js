import { useState, useEffect } from 'react'
// Utils
import getFilterOptions from '../utils/filterBarFilterOptions'
// Components
import Page from '../components/Page'
import ReportCard from '../components/reports/ReportCard'
import ReportModal from '../components/reports/ReportModal'
// Contexts
import { useReportContext } from '../contexts/ReportContext'
import { useGlobalContext } from '../contexts/GlobalContext'
// Styles
import '../styles/Report.css'

const Report = () => {
  const { reports, loadingReports } = useReportContext()
  const { setModalState } = useGlobalContext()

  const [filters, setFilters] = useState({
    vehicle: '',
    user: '',
    created_at: '',
    owner: '',
    status: '',
  })

  useEffect(() => {
    setModalState((prev) => ({
      ...prev,
      modalComponent: ReportModal,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Page
      itemType="Report"
      filters={{ ...filters, type: 'report' }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).reports}
      items={reports}
      CardComponent={ReportCard}
      loadingItem={loadingReports}
    />
  )
}

export default Report
