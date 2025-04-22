import { useLocation } from 'react-router-dom'
// Components
import VehicleModal from './VehicleModal'
// Zustand
import useVehicleStore from '../../stores/useVehicleStore'
import useOwnerStore from '../../stores/useOwnerStore'
import useReportStore from '../../stores/useReportStore'
// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Utils
import withSuccessAlert from '../../utils/successAlert'
import { getVehicleInfoByVehicleId } from '../../utils/getVehicleInfoByVehicleId'
import { getOwnerNameByVehicleId } from '../../utils/getOwnerNameByVehicleId'

const VehicleCard = ({ item }) => {
  const cardItemType = 'Vehicle'

  const location = useLocation()
  const isPathVehicles = location.pathname.includes('vehicle')

  const { owners } = useOwnerStore()
  const { vehicles, deleteVehicle } = useVehicleStore()
  const { openModal, openDeleteModal } = useGlobalContext()
  const { reports } = useReportStore()

  // Delete vehicle with alert
  const deleteVehicleWithAlert = withSuccessAlert(deleteVehicle, 'Vehicle deleted successfully!')

  // Return the last time a vehicle was used in a report
  const getLastUsedDate = (vehicleId) => {
    const lastReport = reports
      .filter((report) => report.vehicle === vehicleId)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0]
    return lastReport ? lastReport.formatted_created_at : 'N/A'
  }

  // Return a truncated text
  const truncateText = (text, maxLength = 20) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
  }

  return (
    <div
      key={item.id}
      className="card"
      title="View Vehicle"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest('.actions')) {
          openModal(VehicleModal, item, cardItemType, true)
        }
      }}
    >
      <div className="card-content">
        <section>
          <header>{truncateText(getVehicleInfoByVehicleId(item.id, vehicles))}</header>
          <div>
            {isPathVehicles && (
              <p>
                <strong>Year:</strong>&nbsp;{item.year}
              </p>
            )}
            <p>
              <strong>Owner:</strong>&nbsp;
              {getOwnerNameByVehicleId(item.id, vehicles, owners)}
            </p>
            {!isPathVehicles && (
              <p>
                <strong>Last used:</strong>&nbsp;{getLastUsedDate(item.id)}
              </p>
            )}
          </div>
        </section>
        <section className="actions">
          {isPathVehicles && (
            <>
              <button
                title="Edit vehicle"
                className="btn btn-edit"
                onClick={() => openModal(VehicleModal, item, cardItemType, false)}
              >
                Edit
              </button>
              <button
                title="Delete vehicle"
                className="btn btn-delete"
                onClick={() => openDeleteModal(item, cardItemType, () => deleteVehicleWithAlert)}
              >
                Delete
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
export default VehicleCard
