import { useState, useEffect, useMemo } from 'react'
// Zustand
import useTaskTemplateStore from '../../stores/useTaskTemplateStore'
// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
// Utils
import { Toast } from '../../utils/sweetalert'
import { isTakenTaskName, isValidPrice } from '../../utils/validation'
import withSuccessAlert from '../../utils/successAlert'
// Styles
import '../../styles/Modal.css'

const TaskTemplateModal = () => {
  // Error messages
  const [errors, setErrors] = useState({
    name: 'This field is required.',
    description: 'This field is required.',
    price: 'This field is required.',
  })

  const { modalState, openDeleteModal, closeModals, toggleReadonly } = useGlobalContext()
  const { createTaskTemplate, updateTaskTemplate, deleteTaskTemplate, taskTemplates, loading } =
    useTaskTemplateStore()

  const [taskTemplateData, setTaskTemplateData] = useState({
    name: modalState.selectedItem?.name || '',
    description: modalState.selectedItem?.description || '',
    price: modalState.selectedItem?.price || '',
  })

  // Create, Update, Delete task with alert
  const createTaskTemplateWithAlert = withSuccessAlert(
    createTaskTemplate,
    'Vehicle created successfully!',
  )
  const updateTaskTemplateWithAlert = withSuccessAlert(
    updateTaskTemplate,
    'Vehicle updated successfully!',
  )
  const deleteTaskTemplateWithAlert = withSuccessAlert(
    deleteTaskTemplate,
    'Vehicle deleted successfully!',
  )

  const handleTaskTemplateChange = (e) => {
    const { name, value } = e.target

    setTaskTemplateData({
      ...taskTemplateData,
      [name]: value,
    })
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!taskTemplateData.name) {
      Toast.fire('Error', 'Please fill in a task name.', 'error')
      return
    }
    if (!taskTemplateData.description) {
      Toast.fire('Error', 'Please fill in a description.', 'error')
      return
    }
    if (!taskTemplateData.price) {
      Toast.fire('Error', 'Please fill in a price.', 'error')
      return
    }

    try {
      const newTaskTemplate = await createTaskTemplateWithAlert(taskTemplateData)
      if (newTaskTemplate) {
        setTaskTemplateData({
          name: '',
          description: '',
          price: '',
        })
      }
    } catch (error) {
      console.error('Error creating task template:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    } finally {
      closeModals()
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!taskTemplateData.name) {
      Toast.fire('Error', 'Please fill in a task name.', 'error')
      return
    }
    if (!taskTemplateData.description) {
      Toast.fire('Error', 'Please fill in a description.', 'error')
      return
    }
    if (!taskTemplateData.price) {
      Toast.fire('Error', 'Please fill in a price.', 'error')
      return
    }

    try {
      await updateTaskTemplateWithAlert(modalState.selectedItem.id, taskTemplateData)
    } catch (error) {
      console.error('Error updating task template:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    } finally {
      setTaskTemplateData(null)
      closeModals()
    }
  }

  // Live validation
  const existingTaskNames = taskTemplates
    .map((task) => task.name)
    .filter(
      (name) =>
        !modalState.selectedItem ||
        name.toLowerCase() !== modalState.selectedItem.name.toLowerCase(),
    )

  useEffect(() => {
    const taskTemplateError =
      taskTemplateData.name.trim() === ''
        ? 'This field is required.'
        : isTakenTaskName(taskTemplateData.name, existingTaskNames)
    setErrors((prevErrors) =>
      prevErrors.name !== taskTemplateError
        ? { ...prevErrors, name: taskTemplateError }
        : prevErrors,
    )
  }, [taskTemplateData.name, existingTaskNames])

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      description: taskTemplateData.description ? '' : 'This field is required.',
    }))
  }, [taskTemplateData.description])

  useEffect(() => {
    const priceError =
      taskTemplateData.price.trim() === ''
        ? 'This field is required.'
        : isValidPrice(taskTemplateData.price)
    setErrors((prevErrors) =>
      prevErrors.price !== priceError ? { ...prevErrors, price: priceError } : prevErrors,
    )
  }, [taskTemplateData.price])

  const isFormValid = useMemo(
    () =>
      !errors.name &&
      !errors.description &&
      !errors.price &&
      taskTemplateData.name &&
      taskTemplateData.description &&
      taskTemplateData.price,
    [errors, taskTemplateData],
  )

  return (
    <div className="modal-container">
      <div className="modal-card">
        <ModalGenericsClose onClose={closeModals} />
        <ModalGenericsTitle
          readonly={modalState.readonly}
          selectedItem={modalState.selectedItem}
          itemType={modalState.itemType}
        />
        <form
          className="modal-form"
          onSubmit={modalState.selectedItem ? handleEditSubmit : handleCreateSubmit}
        >
          <fieldset>
            <label>
              <span>Name:</span>
              <input
                className={errors.name ? 'invalid' : 'valid'}
                type="text"
                name="name"
                value={taskTemplateData.name}
                onChange={handleTaskTemplateChange}
                placeholder="Enter name"
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.name && <>{errors.name}</>}</p>
            </label>

            <label>
              <span>Description:</span>
              <input
                className={errors.description ? 'invalid' : 'valid'}
                type="textarea"
                name="description"
                value={taskTemplateData.description}
                onChange={handleTaskTemplateChange}
                placeholder="Please describe the task"
                required
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.description && <>{errors.description}</>}</p>
            </label>

            <label>
              <span>Price:</span>
              <input
                className={errors.price ? 'invalid' : 'valid'}
                type="text"
                name="price"
                value={taskTemplateData.price}
                onChange={handleTaskTemplateChange}
                placeholder="Enter price"
                disabled={modalState.readonly}
              />
              <p className="error-text">{errors.price && <>{errors.price}</>}</p>
            </label>
          </fieldset>
          <div className="button-group">
            {modalState.selectedItem ? (
              <>
                {modalState.readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Task
                  </button>
                ) : (
                  <button type="submit" disabled={modalState.readonly || !isFormValid || loading}>
                    Update Task
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      modalState.selectedItem,
                      modalState.itemType,
                      () => deleteTaskTemplateWithAlert,
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={modalState.readonly || !isFormValid || loading}>
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
