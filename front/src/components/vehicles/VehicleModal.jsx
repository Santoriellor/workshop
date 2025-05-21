// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Zustand stores
import useVehicleStore from '../../stores/useVehicleStore'
import useOwnerStore from '../../stores/useOwnerStore'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
import FormField from '../formHelper/FormField'
// Hooks
import { useVehicleForm } from '../../hooks/useVehicleForm'
// Utils
import withSuccessAlert from '../../utils/successAlert'
import { Toast } from '../../utils/sweetalert'
// Styles
import '../../styles/Modal.css'
// Data
import brandModelMap from '../../data/brandModelMap.json'

const brands = Object.keys(brandModelMap).sort()

const VehicleModal = () => {
  const { modalState, closeModals, toggleReadonly, openDeleteModal } = useGlobalContext()
  const { vehicles, createVehicle, updateVehicle, deleteVehicle, loading } = useVehicleStore()
  const { owners } = useOwnerStore()

  const initialData = {
    brand: modalState.selectedItem?.brand || '',
    model: modalState.selectedItem?.model || '',
    year: modalState.selectedItem?.year || '',
    license_plate: modalState.selectedItem?.license_plate || '',
    owner: modalState.selectedItem?.owner || '',
  }

  const { data, setData, errors, touched, handleChange, handleBrandChange, handleBlur, isValid } =
    useVehicleForm(initialData, vehicles, modalState.selectedItem)

  // Create, Update, Delete vehicle with alert
  const createVehicleWithAlert = withSuccessAlert(createVehicle, 'Vehicle created successfully!')
  const updateVehicleWithAlert = withSuccessAlert(updateVehicle, 'Vehicle updated successfully!')
  const deleteVehicleWithAlert = withSuccessAlert(deleteVehicle, 'Vehicle deleted successfully!')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) {
      Toast.fire('Error', 'Please correct the errors.', 'error')
      return
    }
    try {
      if (modalState.selectedItem) {
        await updateVehicleWithAlert(modalState.selectedItem.id, {
          ...data,
          updated_at: modalState.selectedItem.updated_at,
        })
      } else {
        await createVehicleWithAlert(data)
        setData(initialData)
      }
    } catch (error) {
      if (error.response?.status === 409) {
        Toast.fire(
          'Error',
          'This vehicle was updated by another user. Please reload and try again.',
          'error',
        )
      } else {
        console.error('Error updating vehicle:', error)
        Toast.fire('Error', 'Something went wrong.', 'error')
      }
    } finally {
      closeModals()
    }
  }

  // Open delete confirmation modal
  const handleDeleteClick = () => {
    openDeleteModal(modalState.selectedItem, modalState.itemType, () => deleteVehicleWithAlert)
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
            <FormField label="Brand" error={touched.brand && errors.brand}>
              <select
                name="brand"
                value={data.brand}
                onChange={handleBrandChange}
                onBlur={handleBlur}
                disabled={modalState.readonly}
                required
                className={touched.brand && errors.brand ? 'invalid' : 'valid'}
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Model" error={touched.model && errors.model}>
              <select
                name="model"
                value={data.model}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={!data.brand || modalState.readonly}
                required
                className={touched.model && errors.model ? 'invalid' : 'valid'}
              >
                <option value="">Select a model</option>
                {brandModelMap[data.brand]?.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Year" error={touched.year && errors.year}>
              <input
                type="number"
                name="year"
                value={data.year}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter year"
                min="1900"
                max={new Date().getFullYear()}
                disabled={modalState.readonly}
                required
                className={touched.year && errors.year ? 'invalid' : 'valid'}
              />
            </FormField>

            <FormField label="License Plate" error={touched.license_plate && errors.license_plate}>
              <input
                type="text"
                name="license_plate"
                value={data.license_plate}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter license plate"
                disabled={modalState.readonly}
                required
                className={touched.license_plate && errors.license_plate ? 'invalid' : 'valid'}
              />
            </FormField>

            <FormField label="Owner" error={touched.owner && errors.owner}>
              <select
                name="owner"
                value={data.owner}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={modalState.readonly}
                required
                className={touched.owner && errors.owner ? 'invalid' : 'valid'}
              >
                <option value="">Select an owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.full_name}
                  </option>
                ))}
              </select>
            </FormField>
          </fieldset>

          <div className="button-group">
            {modalState.selectedItem ? (
              modalState.readonly ? (
                <button type="button" onClick={toggleReadonly}>
                  Edit Vehicle
                </button>
              ) : (
                <button type="submit" disabled={!isValid || loading}>
                  Update Vehicle
                </button>
              )
            ) : (
              <button type="submit" disabled={!isValid || loading}>
                Create Vehicle
              </button>
            )}
            {modalState.selectedItem && (
              <button type="button" onClick={handleDeleteClick}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehicleModal
