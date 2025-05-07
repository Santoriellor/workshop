// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Zustand
import useTaskTemplateStore from '../../stores/useTaskTemplateStore'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
import FormField from '../formHelper/FormField'
// Hooks
import { useTaskTemplateForm } from '../../hooks/useTaskTemplateForm'
// Utils
import withSuccessAlert from '../../utils/successAlert'
import { Toast } from '../../utils/sweetalert'
// Styles
import '../../styles/Modal.css'

const TaskTemplateModal = () => {
  const { modalState, openDeleteModal, closeModals, toggleReadonly } = useGlobalContext()
  const { createTaskTemplate, updateTaskTemplate, deleteTaskTemplate, taskTemplates, loading } =
    useTaskTemplateStore()

  const initialData = {
    name: modalState.selectedItem?.name || '',
    description: modalState.selectedItem?.description || '',
    price: modalState.selectedItem?.price || '',
  }

  const { data, setData, errors, handleChange, isValid } = useTaskTemplateForm(
    initialData,
    taskTemplates,
    modalState.selectedItem,
  )

  // Create, Update, Delete task with alert
  const createTaskTemplateWithAlert = withSuccessAlert(
    createTaskTemplate,
    'Task created successfully!',
  )
  const updateTaskTemplateWithAlert = withSuccessAlert(
    updateTaskTemplate,
    'Task updated successfully!',
  )
  const deleteTaskTemplateWithAlert = withSuccessAlert(
    deleteTaskTemplate,
    'Task deleted successfully!',
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) {
      Toast.fire('Error', 'Please correct the errors.', 'error')
      return
    }
    try {
      if (modalState.selectedItem) {
        await updateTaskTemplateWithAlert(modalState.selectedItem.id, {
          ...data,
          updated_at: modalState.selectedItem.updated_at,
        })
      } else {
        await createTaskTemplateWithAlert(data)
        setData(initialData)
      }
    } catch (error) {
      if (error.response?.status === 409) {
        Toast.fire(
          'Error',
          'This task was updated by another user. Please reload and try again.',
          'error',
        )
      } else {
        console.error('Error updating task:', error)
        Toast.fire('Error', 'Something went wrong.', 'error')
      }
    } finally {
      closeModals()
    }
  }

  // Open delete confirmation modal
  const handleDeleteClick = () => {
    openDeleteModal(modalState.selectedItem, modalState.itemType, () => deleteTaskTemplateWithAlert)
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

            <FormField label="Description" error={errors.description}>
              <input
                className={errors.description ? 'invalid' : 'valid'}
                type="textarea"
                name="description"
                value={data.description}
                onChange={handleChange}
                placeholder="Please describe the task"
                required
                disabled={modalState.readonly}
              />
            </FormField>

            <FormField label="Price" error={errors.price}>
              <input
                className={errors.price ? 'invalid' : 'valid'}
                type="text"
                name="price"
                value={data.price}
                onChange={handleChange}
                placeholder="Enter price"
                disabled={modalState.readonly}
              />
            </FormField>
          </fieldset>

          <div className="button-group">
            {modalState.selectedItem ? (
              <>
                {modalState.readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Task
                  </button>
                ) : (
                  <button type="submit" disabled={modalState.readonly || !isValid || loading}>
                    Update Task
                  </button>
                )}
                <button type="button" onClick={handleDeleteClick}>
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={modalState.readonly || !isValid || loading}>
                Create Task
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
export default TaskTemplateModal
