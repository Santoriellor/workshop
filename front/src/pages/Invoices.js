import { useState, useMemo } from 'react'
// Zustand
import useVehicleStore from '../stores/useVehicleStore'
import useInvoiceStore from '../stores/useInvoiceStore'
import useReportStore from '../stores/useReportStore'
// Components
import ReportCard from '../components/reports/ReportCard'
import InvoiceCard from '../components/invoices/InvoiceCard'
import FilterBar from '../components/FilterBar'
import LoadingScreen from '../components/LoadingScreen'
// Utils
import { Toast } from '../utils/sweetalert'
import getFilterOptions from '../utils/filterBarFilterOptions'
import { filterItems } from '../utils/pageItemFilter'
import { getVehicleInfoByVehicleId } from '../utils/getVehicleInfoByVehicleId'
import withSuccessAlert from '../utils/successAlert'
// Styles
import '../styles/Cards.css'
import '../styles/Invoices.css'

const Invoices = () => {
  const [filters, setFilters] = useState({
    type: '',
    vehicle: '',
    user: '',
    created_at: '',
    owner: '',
    status: '',
    formatted_issued_date: '',
  })
  const filterOptions = getFilterOptions(filters).invoices

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value })
  }

  const { invoices, fetchInvoices, loading: loadingInvoices } = useInvoiceStore()
  const { reports, fetchReports, loading: loadingReports, updateReport } = useReportStore()
  const { vehicles } = useVehicleStore()

  // Update reports with alert
  const updateReportWithAlert = withSuccessAlert(updateReport, 'Report updated successfully!')

  // Filter reports based on filters
  const filteredReports = useMemo(() => {
    // Filter the items
    let reportsAfterFilter = reports.filter((report) =>
      filterItems(
        report,
        {
          ...filters,
          type: 'report',
        },
        vehicles,
        getVehicleInfoByVehicleId,
      ),
    )

    return reportsAfterFilter
  }, [reports, filters, vehicles])

  // Filter invoices based on filters
  const filteredInvoices = useMemo(() => {
    // Filter the items
    let invoicesAfterFilter = invoices.filter((invoice) =>
      filterItems(invoice, { ...filters, type: 'invoices' }),
    )

    return invoicesAfterFilter
  }, [invoices, filters])

  const handleExportClick = async (report) => {
    try {
      await updateReportWithAlert(report.id, {
        ...report,
        status: 'exported',
      })

      fetchReports({ status: 'completed' }, 'vehicle__brand,vehicle__model')
      fetchInvoices({}, '-issued_date')
    } catch (error) {
      console.error('Error exporting report:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    }
  }

  return (
    <>
      {/* Filter bar with filter options */}
      <FilterBar filterOptions={filterOptions} onFilterChange={handleFilterChange} />
      <div className="invoices">
        <div className="invoices-list">
          {loadingReports ? (
            <LoadingScreen fullscreen={false} />
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                item={report}
                handleExportClick={handleExportClick}
              ></ReportCard>
            ))
          ) : (
            <p>No completed reports to export.</p>
          )}
        </div>
        <div className="invoices-divider"></div>
        <div className="invoices-list">
          {loadingInvoices ? (
            <LoadingScreen fullscreen={false} />
          ) : filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} />)
          ) : (
            <p>No invoices available.</p>
          )}
        </div>
      </div>
    </>
  )
}

export default Invoices
