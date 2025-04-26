import { useEffect, useState, useMemo } from 'react'
// Zustand
import useVehicleStore from '../../stores/useVehicleStore'
import useOwnerStore from '../../stores/useOwnerStore'
import useInventoryStore from '../../stores/useInventoryStore'
import useTaskTemplateStore from '../../stores/useTaskTemplateStore'
import useReportStore from '../../stores/useReportStore'
// Contexts
import { useAuth } from '../../contexts/AuthContext'
import { useGlobalContext } from '../../contexts/GlobalContext'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
import SvgTrash from '../svgGenerics/SvgTrash'
// Utils
import { Toast } from '../../utils/sweetalert'
import { isValidQuantityInStock } from '../../utils/validation'
import { getOwnerNameByVehicleId } from '../../utils/getOwnerNameByVehicleId'
import withSuccessAlert from '../../utils/successAlert'
// Styles
import '../../styles/Modal.css'
import '../../styles/ReportModal.css'

const ReportModal = () => {
  // Error messages
  const [errors, setErrors] = useState({
    vehicle: '',
    status: '',
    tasks: '',
    parts: '',
    part_quantity: '',
  })

  const { authenticatedUser } = useAuth()
  const { modalState, openDeleteModal, closeModals, toggleReadonly } = useGlobalContext()

  const {
    createReport,
    updateReport,
    deleteReport,
    loading,
    loadingTasks,
    loadingParts,
    tasks,
    createTask,
    deleteTask,
    parts,
    createPart,
    deletePart,
  } = useReportStore()
  const { vehicles } = useVehicleStore()
  const { owners } = useOwnerStore()
  const { inventory } = useInventoryStore()
  const { taskTemplates } = useTaskTemplateStore()

  const [reportData, setReportData] = useState({
    vehicle: modalState.selectedItem?.vehicle || '',
    user: authenticatedUser.id,
    status: modalState.selectedItem?.status || 'pending',
    remarks: modalState.selectedItem?.remarks || '',
  })

  const [selectedTask, setSelectedTask] = useState('')
  const [selectedPart, setSelectedPart] = useState('')
  const [quantityPart, setQuantityPart] = useState('1')
  const [updatedTasks, setUpdatedTasks] = useState(tasks || [])
  const [updatedParts, setUpdatedParts] = useState(parts || [])

  // Create, update, delete reports with alert
  const createReportWithAlert = withSuccessAlert(createReport, 'Report created successfully!')
  const updateReportWithAlert = withSuccessAlert(updateReport, 'Report updated successfully!')
  const deleteReportWithAlert = withSuccessAlert(deleteReport, 'Report deleted successfully!')

  const handleReportChange = (e) => {
    const { name, value } = e.target

    setReportData({
      ...reportData,
      [name]: name === 'vehicle' ? Number(value) : value,
    })
  }
  const handleTaskChange = (e) => {
    setSelectedTask(e.target.value)
  }
  const handlePartChange = (e) => {
    setSelectedPart(e.target.value)
  }
  const handleQuantityChange = (e) => {
    let value = e.target.value

    // Remove leading zero if the second character is not a dot
    if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
      value = value.slice(1)
    }
    // Prevent leading dots by converting ".5" to "0.5"
    if (value.startsWith('.')) {
      value = '0' + value
    }

    // Allow only numbers with up to 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setQuantityPart(value)
    }
  }

  const addTask = () => {
    if (!selectedTask) {
      Toast.fire('Error', 'Please select a repair task.', 'error')
      return
    }

    const taskId = Number(selectedTask)
    const task = taskTemplates.find((item) => item.id === taskId)
    if (!task) return

    setUpdatedTasks([...updatedTasks, { task_template: task.id }])

    setSelectedTask('')
  }
  const addPart = () => {
    if (!selectedPart) {
      Toast.fire('Error', 'Please select a repair part.', 'error')
      return
    }
    if (errors.part_quantity) {
      Toast.fire('Error', 'Please give a quantity.', 'error')
      return
    }

    const partId = Number(selectedPart)
    const part = inventory.find((item) => item.id === partId)
    if (!part) return

    setUpdatedParts([...updatedParts, { part: part.id, quantity_used: Number(quantityPart) }])

    setSelectedPart('')
  }
  const removeTask = (taskIndex) => {
    setUpdatedTasks((prevTasks) => prevTasks.filter((_, index) => index !== taskIndex))
  }
  const removePart = (partIndex) => {
    setUpdatedParts((prevParts) => prevParts.filter((_, index) => index !== partIndex))
  }
  const getTaskById = (taskTemplateId) => {
    const task = taskTemplates?.find((item) => item.id === taskTemplateId)
    if (!task) return
    return task
  }
  const getPartById = (partId) => {
    const part = inventory?.find((item) => item.id === partId)
    if (!part) return
    return part
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!reportData.vehicle) {
      Toast.fire('Error', 'Please select a vehicle.', 'error')
      return
    }

    try {
      const newReport = await createReportWithAlert(reportData)
      if (newReport && updatedTasks.length > 0) {
        try {
          await Promise.all(
            updatedTasks.map((task) => createTask({ ...task, report: newReport.id })),
          )
        } catch (error) {
          console.error('Error creating tasks:', error)
        } finally {
          setUpdatedTasks([])
        }
      }
      if (newReport && updatedParts.length > 0) {
        try {
          await Promise.all(
            updatedParts.map((part) =>
              createPart({
                ...part,
                report: newReport.id,
              }),
            ),
          )
        } catch (error) {
          console.error('Error creating parts:', error)
        } finally {
          setUpdatedParts([])
        }
      }
      closeModals()
    } catch (error) {
      console.error('Error creating report:', error)
      Toast.fire('Error', 'Something went wrong.', 'error')
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!reportData.vehicle) {
      Toast.fire('Error', 'Please select a vehicle.', 'error')
      return
    }

    try {
      const updatedReport = await updateReportWithAlert(modalState.selectedItem.id, {
        ...reportData,
        updated_at: modalState.selectedItem.updated_at, // Concurrency check
      })

      if (!updatedReport) return

      // Handle tasks
      try {
        // Find new tasks that are in updatedTasks but not in tasks
        const newTasks = updatedTasks.filter(
          (updatedTask) => !tasks.some((task) => task.id === updatedTask.id),
        )

        // Find deleted tasks that are in tasks but not in updatedTasks
        const deletedTasks = tasks.filter(
          (task) => !updatedTasks.some((updatedTask) => updatedTask.id === task.id),
        )
        // Handle new tasks and deleted tasks
        if (newTasks.length > 0) {
          await Promise.all(
            newTasks.map((task) => createTask({ ...task, report: updatedReport.id })),
          )
        }
        if (deletedTasks.length > 0) {
          await Promise.all(deletedTasks.map((task) => deleteTask(task.id)))
        }
      } catch (error) {
        console.error('Error updating tasks:', error)
      }

      // Handle Parts
      try {
        // Find new parts that are in updatedParts but not in parts
        const newParts = updatedParts.filter(
          (updatedPart) => !parts.some((part) => part.id === updatedPart.id),
        )
        // Find deleted parts that are in parts but not in updatedParts
        const deletedParts = parts.filter(
          (part) => !updatedParts.some((updatedPart) => updatedPart.id === part.id),
        )
        // Handle new parts and deleted parts
        if (newParts.length > 0) {
          await Promise.all(
            newParts.map((part) =>
              createPart({
                ...part,
                report: updatedReport.id,
              }),
            ),
          )
        }
        if (deletedParts.length > 0) {
          await Promise.all(deletedParts.map((part) => deletePart(part.id)))
        }
      } catch (error) {
        console.error('Error updating parts:', error)
      }
    } catch (error) {
      if (error.response?.status === 409) {
        Toast.fire(
          'Error',
          'This report was updated by another user. Please reload and try again.',
          'error',
        )
      } else {
        console.error('Error updating report:', error)
        Toast.fire('Error', 'Something went wrong.', 'error')
      }
    }
    closeModals()
  }

  useEffect(() => {
    if (!modalState.selectedItem) {
      setUpdatedTasks([])
      setUpdatedParts([])
      setReportData({
        vehicle: '',
        user: authenticatedUser.id,
        status: 'pending',
        remarks: '',
      })
    }
  }, [modalState.selectedItem, authenticatedUser.id])

  useEffect(() => {
    if (modalState.selectedItem && tasks) {
      setUpdatedTasks(tasks)
    }
  }, [modalState.selectedItem, tasks])

  useEffect(() => {
    if (modalState.selectedItem && parts) {
      setUpdatedParts(parts)
    }
  }, [modalState.selectedItem, parts])

  // Live validation

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      vehicle: reportData.vehicle ? '' : 'This field is required.',
    }))
  }, [reportData.vehicle])

  useEffect(() => {
    const taskError = !updatedTasks.length
      ? 'At least one task is required.'
      : isValidQuantityInStock(quantityPart.toString())
    setErrors((prevErrors) =>
      prevErrors.tasks !== taskError ? { ...prevErrors, tasks: taskError } : prevErrors,
    )
  }, [updatedTasks, quantityPart])

  useEffect(() => {
    const quantityError =
      quantityPart === null ||
      quantityPart === undefined ||
      quantityPart.toString().trim() === '' ||
      quantityPart === '0'
        ? 'The quantity is required to add a part.'
        : isValidQuantityInStock(quantityPart.toString())
    setErrors((prevErrors) =>
      prevErrors.part_quantity !== quantityError
        ? { ...prevErrors, part_quantity: quantityError }
        : prevErrors,
    )
  }, [quantityPart])

  const isFormValid = useMemo(
    () =>
      !errors.vehicle &&
      !errors.status &&
      !errors.tasks &&
      reportData.vehicle &&
      reportData.status &&
      updatedTasks,
    [errors, reportData, updatedTasks],
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
          <div className="report-form">
            <fieldset>
              <label>
                <span>Vehicle:</span>
                <select
                  className={errors.vehicle ? 'invalid' : 'valid'}
                  name="vehicle"
                  value={reportData.vehicle}
                  onChange={handleReportChange}
                  required
                  disabled={modalState.readonly}
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.__str__} - {getOwnerNameByVehicleId(vehicle.id, vehicles, owners)}
                    </option>
                  ))}
                </select>
                <p className="error-text">{errors.vehicle && <>{errors.vehicle}</>}</p>
              </label>

              <label>
                <span>Status:</span>
                <select
                  className={errors.status ? 'invalid' : 'valid'}
                  name="status"
                  value={reportData.status}
                  onChange={handleReportChange}
                  required
                  disabled={modalState.readonly}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <p className="error-text">{errors.status && <>{errors.status}</>}</p>
              </label>

              <label>
                <span>Remarks:</span>
                <textarea
                  name="remarks"
                  value={reportData.remarks}
                  onChange={handleReportChange}
                  placeholder="Enter remarks"
                  disabled={modalState.readonly}
                />
              </label>
            </fieldset>
            <div className="input-divider"></div>
            <fieldset>
              {/* Tasks select */}
              <div>
                <span>Repair Tasks:</span>
                <div className="repair-section">
                  <select
                    className={errors.tasks ? 'invalid' : 'valid'}
                    value={selectedTask}
                    onChange={handleTaskChange}
                    disabled={modalState.readonly}
                  >
                    <option value="">Select a repair task</option>
                    {taskTemplates?.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name} - €{task.price}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="small"
                    onClick={addTask}
                    disabled={modalState.readonly}
                  >
                    Add Task
                  </button>
                </div>
                {/* Tasks display */}
                {loadingTasks ? (
                  <span> Loading tasks...</span>
                ) : updatedTasks && updatedTasks?.length > 0 ? (
                  <ul className="repair-list">
                    {updatedTasks?.map((task, index) => {
                      const taskData = getTaskById(task.task_template)
                      return (
                        <li key={index}>
                          <p>
                            {taskData ? taskData.name : 'Unknown Task'} - €
                            {taskData ? taskData.price : 'N/A'}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeTask(index)}
                            disabled={modalState.readonly}
                          >
                            <SvgTrash />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <span>No tasks available</span>
                )}
                <p className="error-text">{errors.tasks && <>{errors.tasks}</>}</p>
              </div>
              {/* Parts select */}
              <div>
                <span>Repair Parts:</span>
                <div className="repair-section">
                  <select
                    value={selectedPart}
                    onChange={handlePartChange}
                    disabled={modalState.readonly}
                  >
                    <option value="">Select a repair part</option>
                    {inventory.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name} - €{part.unit_price}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={quantityPart}
                    onChange={handleQuantityChange}
                    disabled={modalState.readonly}
                  />
                  <button
                    type="button"
                    className="small"
                    onClick={addPart}
                    disabled={modalState.readonly}
                  >
                    Add Part
                  </button>
                </div>
                {/* Parts display */}
                {loadingParts ? (
                  <span> Loading parts...</span>
                ) : updatedParts && updatedParts?.length > 0 ? (
                  <ul className="repair-list">
                    {updatedParts?.map((part, index) => {
                      const partData = getPartById(part.part)
                      return (
                        <li key={index}>
                          <p>
                            {part.quantity_used}x&nbsp;
                            {partData ? partData.name : 'Unknown Part'} - €
                            {partData ? partData.unit_price : 'N/A'}
                          </p>
                          <button
                            title="Remove Part"
                            type="button"
                            onClick={() => removePart(index)}
                            disabled={modalState.readonly}
                          >
                            <SvgTrash />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <span>No parts available</span>
                )}
                <p className="error-text">{errors.part_quantity && <>{errors.part_quantity}</>}</p>
              </div>
            </fieldset>
          </div>
          <div className="button-group">
            {modalState.selectedItem ? (
              <>
                {modalState.readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Report
                  </button>
                ) : (
                  <button type="submit" disabled={modalState.readonly || !isFormValid || loading}>
                    Update Report
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      modalState.selectedItem,
                      modalState.itemType,
                      () => deleteReportWithAlert,
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={modalState.readonly || !isFormValid || loading}>
                Create Report
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportModal
