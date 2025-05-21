import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
// Components
import ReportModal from './ReportModal'
import SvgStatus from '../svgGenerics/SvgStatus'
// Zustand
import useVehicleStore from '../../stores/useVehicleStore'
import useOwnerStore from '../../stores/useOwnerStore'
import useReportStore from '../../stores/useReportStore'
import useUserStore from '../../stores/useUserStore'
// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Utils
import { getVehicleInfoByVehicleId } from '../../utils/getVehicleInfoByVehicleId'
import { getOwnerNameByVehicleId } from '../../utils/getOwnerNameByVehicleId'
import withSuccessAlert from '../../utils/successAlert'
import { truncateText } from '../../utils/stringUtils'

const ReportCard = ({ item, handleExportClick }) => {
  const cardItemType = 'Report'

  const location = useLocation()
  const isPathReports = location.pathname.includes('report')
  const isPathDashboard = location.pathname.includes('dashboard')
  const isPathInvoices = location.pathname.includes('invoices')

  const { openModal, openDeleteModal } = useGlobalContext()
  const { deleteReport } = useReportStore()
  const { owners } = useOwnerStore()
  const { vehicles } = useVehicleStore()
  const { users } = useUserStore()

  // Delete reports with alert
  const deleteReportWithAlert = withSuccessAlert(deleteReport, 'Report deleted successfully!')

  // Get user name by user Id
  const getUserNameById = (userId) => {
    return users.find((user) => user.id === userId)?.username || 'Unknown User'
  }

  // Memoized values
  const vehicleInfo = useMemo(
    () => getVehicleInfoByVehicleId(item.vehicle, vehicles),
    [item.vehicle, vehicles],
  )
  const ownerName = useMemo(
    () => getOwnerNameByVehicleId(item.vehicle, vehicles, owners),
    [item.vehicle, vehicles, owners],
  )
  const userName = useMemo(() => getUserNameById(item.user), [item.user])

  // Open viewing modal
  const handleCardClick = (e) => {
    // Prevent triggering view mode if clicking on an action button
    if (!e.target.closest('.actions')) {
      openModal(ReportModal, item, cardItemType, true)
    }
  }
  // Open editing modal
  const handleEditClick = () => {
    openModal(ReportModal, item, cardItemType, false)
  }
  // Open delete confirmation modal
  const handleDeleteClick = () => {
    openDeleteModal(item, cardItemType, () => deleteReportWithAlert)
  }

  return (
    <div key={item.id} className="card" title="View Report" onClick={handleCardClick}>
      {!isPathInvoices && (
        <div className="status">
          <SvgStatus status={item.status} />
        </div>
      )}

      <div className="card-content">
        <section>
          <header>{truncateText(vehicleInfo, 30)}</header>
          <div>
            {(isPathReports || isPathInvoices || isPathDashboard) && (
              <>
                <p>
                  <strong>Created Date:</strong>&nbsp;
                  {item.formatted_created_at}
                </p>
                <p>
                  <strong>Owner:</strong>&nbsp;
                  {ownerName}
                </p>
              </>
            )}
            {!isPathInvoices && (
              <>
                <p>
                  <strong>Status:</strong>&nbsp;
                  <span
                    style={{
                      color:
                        item.status === 'pending'
                          ? 'red'
                          : item.status === 'in_progress'
                            ? 'orange'
                            : 'green',
                    }}
                  >
                    {item.status_display}
                  </span>
                </p>
                <p>
                  <strong>Created By:</strong>&nbsp;
                  {userName}
                </p>
              </>
            )}
          </div>
        </section>
        {(isPathReports || isPathInvoices) && (
          <>
            <section className={isPathInvoices ? 'actions' : 'actions hide'}>
              {isPathReports && (
                <>
                  <button title="Edit Report" className="btn btn-edit" onClick={handleEditClick}>
                    Edit
                  </button>
                  <button
                    title="Delete Report"
                    className="btn btn-delete"
                    onClick={handleDeleteClick}
                  >
                    Delete
                  </button>
                </>
              )}

              {isPathInvoices && item.status === 'completed' && (
                <>
                  <button
                    title="Export Report"
                    className="btn btn-edit"
                    onClick={() => handleExportClick(item)}
                  >
                    Invoice and PDF
                  </button>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
export default ReportCard
