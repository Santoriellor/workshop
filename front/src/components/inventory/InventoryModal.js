// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Zustand
import useInventoryStore from '../../stores/useInventoryStore'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
import FormField from '../formHelper/FormField'
// Hooks
import { useInventoryForm } from '../../hooks/useInventoryForm'
// Utils
import { Toast } from '../../utils/sweetalert'
import withSuccessAlert from '../../utils/successAlert'
// Styles
import '../../styles/Modal.css'

/* Could be put into a JSON file */
// CATEGORIES
const categories = [
  'Brakes',
  'Engine',
  'Exhaust',
  'Suspension',
  'Transmission',
  'Wheels',
  'Steering',
  'Fluids',
  'Electrical',
  'Cooling',
]

const InventoryModal = () => {
  const { modalState, openDeleteModal, closeModals, toggleReadonly } = useGlobalContext()
  const { inventory, createInventory, updateInventory, deleteInventory, loading } =
    useInventoryStore()

  const initialData = {
    name: modalState.selectedItem?.name || '',
    reference_code: modalState.selectedItem?.reference_code || '',
    category: modalState.selectedItem?.category || '',
    quantity_in_stock: modalState.selectedItem?.quantity_in_stock || '',
    unit_price: modalState.selectedItem?.unit_price || '',
  }

  const { data, setData, errors, handleChange, isValid } = useInventoryForm(
    initialData,
    inventory,
    modalState.selectedItem,
  )

  // Create, Update, Delete part with alert
  const createInventoryPartWithAlert = withSuccessAlert(
    createInventory,
    'Part created successfully!',
  )
  const updateInventoryPartWithAlert = withSuccessAlert(
    updateInventory,
    'Part updated successfully!',
  )
  const deleteInventoryPartWithAlert = withSuccessAlert(
    deleteInventory,
    'Part deleted successfully!',
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) {
      Toast.fire('Error', 'Please correct the errors.', 'error')
      return
    }
    try {
      if (modalState.selectedItem) {
        await updateInventoryPartWithAlert(modalState.selectedItem.id, {
          ...data,
          updated_at: modalState.selectedItem.updated_at,
        })
      } else {
        await createInventoryPartWithAlert(data)
        setData(initialData)
      }
    } catch (error) {
      if (error.response?.status === 409) {
        Toast.fire(
          'Error',
          'This part was updated by another user. Please reload and try again.',
          'error',
        )
      } else {
        console.error('Error updating part:', error)
        Toast.fire('Error', 'Something went wrong.', 'error')
      }
    } finally {
      closeModals()
    }
  }

  // Open delete confirmation modal
  const handleDeleteClick = () => {
    openDeleteModal(
      modalState.selectedItem,
      modalState.itemType,
      () => deleteInventoryPartWithAlert,
    )
  }

  return (
    <div className="modal-container">
      <div className="modal-card">
        <ModalGenericsClose onClose={closeModals} />
        <ModalGenericsTitle
          readonly={modalState.readonly}
          selectedItem={modalState.selectedItem}
          itemType={modalState.itemType}
        />
        <form className="modal-form" onSubmit={handleSubmit}>
          <fieldset>
            <FormField label="Name" error={errors.name}>
              <input
                className={errors.name ? 'invalid' : 'valid'}
                type="text"
                name="name"
                value={data.name}
                onChange={handleChange}
                placeholder="Enter name"
                required
                disabled={modalState.readonly}
              />
            </FormField>

            <FormField label="Reference code" error={errors.reference_code}>
              <input
                className={errors.reference_code ? 'invalid' : 'valid'}
                type="text"
                name="reference_code"
                value={data.reference_code}
                onChange={handleChange}
                placeholder="Enter reference code"
                required
                disabled={modalState.readonly}
              />
            </FormField>

            <FormField label="Category" error={errors.category}>
              <select
                className={errors.category ? 'invalid' : 'valid'}
                name="category"
                value={data.category}
                onChange={handleChange}
                required
                disabled={modalState.readonly}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Quantity in stock" error={errors.quantity_in_stock}>
              <input
                className={errors.quantity_in_stock ? 'invalid' : 'valid'}
                type="text"
                name="quantity_in_stock"
                value={data.quantity_in_stock}
                onChange={handleChange}
                placeholder="Enter quantity in stock"
                disabled={modalState.readonly}
              />
            </FormField>

            <FormField label="Unit price" error={errors.unit_price}>
              <input
                className={errors.unit_price ? 'invalid' : 'valid'}
                type="text"
                name="unit_price"
                value={data.unit_price}
                onChange={handleChange}
                placeholder="Enter unit price"
                disabled={modalState.readonly}
              />
            </FormField>
          </fieldset>
          <div className="button-group">
            {modalState.selectedItem ? (
              <>
                {modalState.readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Part
                  </button>
                ) : (
                  <button type="submit" disabled={modalState.readonly || !isValid || loading}>
                    Update Part
                  </button>
                )}
                <button type="button" onClick={handleDeleteClick}>
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={modalState.readonly || !isValid || loading}>
                Create Part
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
export default InventoryModal
