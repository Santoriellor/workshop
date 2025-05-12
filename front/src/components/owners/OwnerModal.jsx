// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Zustand
import useOwnerStore from '../../stores/useOwnerStore'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
import FormField from '../formHelper/FormField'
// Hooks
import { useOwnerForm } from '../../hooks/useOwnerForm'
// Utils
import { Toast } from '../../utils/sweetalert'
import withSuccessAlert from '../../utils/successAlert'
// Styles
import '../../styles/Modal.css'
import '../../styles/Auth.css'

const OwnerModal = () => {
  const { modalState, openDeleteModal, closeModals, toggleReadonly } = useGlobalContext()
  const { owners, createOwner, updateOwner, deleteOwner, loading } = useOwnerStore()

  const initialData = {
    first_name: modalState.selectedItem?.first_name || '',
    last_name: modalState.selectedItem?.last_name || '',
    email: modalState.selectedItem?.email || '',
    phone: modalState.selectedItem?.phone || '',
    address: modalState.selectedItem?.address || '',
  }

  const { data, setData, errors, handleChange, isValid } = useOwnerForm(
    initialData,
    owners,
    modalState.selectedItem,
  )

  // Create, Update, Delete owner with alert
  const createOwnerWithAlert = withSuccessAlert(createOwner, 'Owner created successfully!')
  const updateOwnerWithAlert = withSuccessAlert(updateOwner, 'Owner updated successfully!')
  const deleteOwnerWithAlert = withSuccessAlert(deleteOwner, 'Owner deleted successfully!')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) {
      Toast.fire('Error', 'Please correct the errors.', 'error')
      return
    }
    try {
      if (modalState.selectedItem) {
        await updateOwnerWithAlert(modalState.selectedItem.id, {
          ...data,
          updated_at: modalState.selectedItem.updated_at,
        })
      } else {
        await createOwnerWithAlert(data)
        setData(initialData)
      }
    } catch (error) {
      if (error.response?.status === 409) {
        Toast.fire(
          'Error',
          'This owner was updated by another user. Please reload and try again.',
          'error',
        )
      } else {
        console.error('Error updating owner:', error)
        Toast.fire('Error', 'Something went wrong.', 'error')
      }
    } finally {
      closeModals()
    }
  }

  // Open delete confirmation modal
  const handleDeleteClick = () => {
    openDeleteModal(modalState.selectedItem, modalState.itemType, () => deleteOwnerWithAlert)
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
            <FormField label="First name" error={errors.first_name}>
              <input
                className={errors.first_name ? 'invalid' : 'valid'}
                type="text"
                name="first_name"
                value={data.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
                required
                disabled={modalState.readonly}
              />
            </FormField>

            <FormField label="Last name" error={errors.last_name}>
              <input
                className={errors.last_name ? 'invalid' : 'valid'}
                type="text"
                name="last_name"
                value={data.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
                required
                disabled={modalState.readonly}
              />
            </FormField>

            <FormField label="Email" error={errors.email}>
              <input
                className={errors.email ? 'invalid' : 'valid'}
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
                disabled={modalState.readonly}
              />
            </FormField>

            <FormField label="Address" error={errors.address}>
              <input
                className={errors.address ? 'invalid' : 'valid'}
                type="text"
                name="address"
                value={data.address}
                onChange={handleChange}
                placeholder="Enter address"
                required
                disabled={modalState.readonly}
              />
            </FormField>

            <FormField label="Phone" error={errors.phone}>
              <input
                className={errors.phone ? 'invalid' : 'valid'}
                type="text"
                name="phone"
                value={data.phone}
                onChange={handleChange}
                placeholder="Enter phone"
                required
                disabled={modalState.readonly}
              />
            </FormField>
          </fieldset>
          <div className="button-group">
            {modalState.selectedItem ? (
              <>
                {modalState.readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Owner
                  </button>
                ) : (
                  <button type="submit" disabled={modalState.readonly || !isValid || loading}>
                    Update Owner
                  </button>
                )}
                <button type="button" onClick={handleDeleteClick}>
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={modalState.readonly || !isValid || loading}>
                Create Owner
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
export default OwnerModal
