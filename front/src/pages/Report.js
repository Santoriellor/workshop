import { useState } from 'react'
// Utils
import getFilterOptions from '../utils/filterBarFilterOptions'
// Components
import Page from '../components/Page'
import ReportCard from '../components/reports/ReportCard'
// Zustand stores
import useReportStore from '../stores/useReportStore'
// Styles
import '../styles/Report.css'

const Report = () => {
  const { reports, loading } = useReportStore()
  const [filters, setFilters] = useState({
    vehicle: '',
    user: '',
    created_at: '',
    owner: '',
    status: '',
  })

  return (
    <Page
      itemType="Report"
      filters={{ ...filters, type: 'report' }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).reports}
      items={reports}
      CardComponent={ReportCard}
      loadingItem={loading}
    />
  )
}

export default Report
