import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
// Components
import VehicleModal from './VehicleModal'
// Zustand
import useVehicleStore from '../../stores/useVehicleStore'
import useOwnerStore from '../../stores/useOwnerStore'
// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Utils
import withSuccessAlert from '../../utils/successAlert'
import { getVehicleInfoByVehicleId } from '../../utils/getVehicleInfoByVehicleId'
import { getOwnerNameByVehicleId } from '../../utils/getOwnerNameByVehicleId'
import { truncateText } from '../../utils/stringUtils'

const VehicleCard = ({ item }) => {
  const cardItemType = 'Vehicle'

  const location = useLocation()
  const isPathVehicles = location.pathname.includes('vehicle')

  const { owners } = useOwnerStore()
  const { vehicles, deleteVehicle } = useVehicleStore()
  const { openModal, openDeleteModal } = useGlobalContext()

  // Delete vehicle with alert
  const deleteVehicleWithAlert = withSuccessAlert(deleteVehicle, 'Vehicle deleted successfully!')

  // Memoized values
  const vehicleInfo = useMemo(
    () => getVehicleInfoByVehicleId(item.id, vehicles),
    [item.id, vehicles],
  )
  const ownerName = useMemo(
    () => getOwnerNameByVehicleId(item.id, vehicles, owners),
    [item.id, vehicles, owners],
  )

  // Open viewing modal
  const handleCardClick = (e) => {
    // Prevent triggering view mode if clicking on an action button
    if (!e.target.closest('.actions')) {
      openModal(VehicleModal, item, cardItemType, true)
    }
  }
  // Open editing modal
  const handleEditClick = () => {
    openModal(VehicleModal, item, cardItemType, false)
  }
  // Open delete confirmation modal
  const handleDeleteClick = () => {
    openDeleteModal(item, cardItemType, () => deleteVehicleWithAlert)
  }

  return (
    <div className="card" title="View Vehicle" onClick={handleCardClick}>
      <div className="card-content">
        <section>
          <header>{truncateText(vehicleInfo, 30)}</header>
          <div>
            {isPathVehicles && (
              <p>
                <strong>Year:</strong>&nbsp;{item.year}
              </p>
            )}
            <p>
              <strong>Owner:</strong>&nbsp;
              {ownerName}
            </p>
          </div>
        </section>
        <section className="actions hide">
          {isPathVehicles && (
            <>
              <button title="Edit vehicle" className="btn btn-edit" onClick={handleEditClick}>
                Edit
              </button>
              <button title="Delete vehicle" className="btn btn-delete" onClick={handleDeleteClick}>
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
