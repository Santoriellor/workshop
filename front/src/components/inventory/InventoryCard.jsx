import { useLocation } from 'react-router-dom'
// Components
import InventoryModal from './InventoryModal'
// Zustand
import useInventoryStore from '../../stores/useInventoryStore'
// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Utils
import withSuccessAlert from '../../utils/successAlert'

const InventoryCard = ({ item }) => {
  const cardItemType = 'Inventory part'

  const location = useLocation()
  const isPathInventory = location.pathname.includes('inventory')

  const { deleteInventory } = useInventoryStore()
  const { openModal, openDeleteModal } = useGlobalContext()

  // Delete part with alert
  const deleteInventoryPartWithAlert = withSuccessAlert(
    deleteInventory,
    'Vehicle deleted successfully!',
  )

  const isLowerThan10 = (item) => {
    if (item.quantity_in_stock < 10) return true
    return false
  }

  // Open viewing modal
  const handleCardClick = (e) => {
    // Prevent triggering view mode if clicking on an action button
    if (!e.target.closest('.actions')) {
      openModal(InventoryModal, item, cardItemType, true)
    }
  }
  // Open editing modal
  const handleEditClick = () => {
    openModal(InventoryModal, item, cardItemType, false)
  }
  // Open delete confirmation modal
  const handleDeleteClick = () => {
    openDeleteModal(item, cardItemType, () => deleteInventoryPartWithAlert)
  }

  return (
    <div
      key={item.id}
      className={isLowerThan10(item) ? 'card low-inventory' : 'card'}
      title="View inventory part"
      onClick={handleCardClick}
    >
      <div className="card-content">
        <section>
          <header>{item.name}</header>
          <div>
            <p>
              <strong>Reference:</strong>&nbsp;{item.reference_code}
            </p>
            <p>
              <strong>Quantity:</strong>&nbsp;{item.quantity_in_stock}
            </p>
            {isPathInventory && (
              <>
                <p>
                  <strong>Category:</strong>&nbsp;
                  {item.category}
                </p>
                <p>
                  <strong>Unit price:</strong>&nbsp;{item.unit_price} CHF
                </p>
              </>
            )}
          </div>
        </section>
        {isPathInventory && (
          <>
            <section className="actions hide">
              <button
                title="Edit inventory part"
                className="btn btn-edit"
                onClick={handleEditClick}
              >
                Edit
              </button>
              <button
                title="Delete inventory part"
                className="btn btn-delete"
                onClick={handleDeleteClick}
              >
                Delete
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
export default InventoryCard
