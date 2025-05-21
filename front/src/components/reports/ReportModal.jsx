import { useMemo, useCallback } from 'react'
// Contexts
import { useAuth } from '../../contexts/AuthContext'
import { useGlobalContext } from '../../contexts/GlobalContext'
// Zustand
import useVehicleStore from '../../stores/useVehicleStore'
import useOwnerStore from '../../stores/useOwnerStore'
import useInventoryStore from '../../stores/useInventoryStore'
import useTaskTemplateStore from '../../stores/useTaskTemplateStore'
import useReportStore from '../../stores/useReportStore'
// Components
import ModalGenericsClose from '../modalGenerics/ModalGenericsClose'
import ModalGenericsTitle from '../modalGenerics/ModalGenericsTitle'
import FormField from '../formHelper/FormField'
import TaskFieldset from './taskandpart/TaskFieldset'
import PartFieldset from './taskandpart/PartFieldset'
// Hooks
import { useReportModal } from '../../hooks/useReportModal'
import { useReportForm } from '../../hooks/useReportForm'
// Utils
import { Toast } from '../../utils/sweetalert'
import { getOwnerNameByVehicleId } from '../../utils/getOwnerNameByVehicleId'
import withSuccessAlert from '../../utils/successAlert'
import { formatQuantity } from '../../utils/stringUtils'
// Styles
import '../../styles/Modal.css'
import '../../styles/ReportModal.css'

const ReportModal = () => {
  const { authenticatedUser } = useAuth()
  const { modalState, openDeleteModal, closeModals, toggleReadonly } = useGlobalContext()

  const { vehicles } = useVehicleStore()
  const { owners } = useOwnerStore()
  const { inventory } = useInventoryStore()
  const { taskTemplates } = useTaskTemplateStore()
  const { createReport, updateReport, deleteReport, loading } = useReportStore()

  const selectedReport = useMemo(() => modalState.selectedItem, [modalState.selectedItem])

  const initialData = useMemo(
    () => ({
      vehicle: selectedReport?.vehicle ?? '',
      user: authenticatedUser.id,
      status: selectedReport?.status ?? 'pending',
      remarks: selectedReport?.remarks ?? '',
      updated_at: selectedReport.updated_at,
    }),
    [selectedReport, authenticatedUser.id],
  )

  const {
    taskIds,
    partsUsed,
    selectedTaskId,
    selectedPartId,
    quantityPart,
    setQuantityPart,
    handleTaskChange,
    handlePartChange,
    addTask,
    removeTask,
    addPart,
    removePart,
  } = useReportModal(
    taskTemplates,
    inventory,
    selectedReport?.tasks_data ?? [],
    selectedReport?.parts_data ?? [],
    Boolean(selectedReport),
    modalState.showModal,
  )

  const { data, errors, touched, handleChange, handleBlur, isValid } = useReportForm(
    initialData,
    taskIds,
    partsUsed,
    quantityPart,
  )

  // Create, update, delete reports with alert
  const createReportWithAlert = withSuccessAlert(createReport, 'Report created successfully!')
  const updateReportWithAlert = withSuccessAlert(updateReport, 'Report updated successfully!')
  const deleteReportWithAlert = withSuccessAlert(deleteReport, 'Report deleted successfully!')

  const handleQuantityChange = useCallback(
    (e) => {
      const controlledValue = formatQuantity(e.target.value)
      if (controlledValue !== null) {
        setQuantityPart(controlledValue)
      }
    },
    [setQuantityPart],
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) {
      Toast.fire('Error', 'Please correct the errors.', 'error')
      return
    }

    const isEdit = Boolean(selectedReport)
    try {
      let report
      // ------ADDING TASKS AND PARTS TO THE REPORT DATA ------
      const reportData = {
        ...data,
        tasks: taskIds,
        parts: partsUsed.map((part) => ({
          part: part.partId,
          quantity_used: part.quantity_used,
        })),
      }
      // ----- REPORT CREATION OR UPDATE -----
      if (isEdit) {
        report = await updateReportWithAlert(selectedReport.id, reportData)
        if (!report) return
      } else {
        report = await createReportWithAlert(reportData)
      }

      if (!report) throw new Error('Report creation or update failed.')

      closeModals()
    } catch (error) {
      if (isEdit && error.response?.status === 409) {
        Toast.fire(
          'Error',
          'This report was updated by another user. Please reload and try again.',
          'error',
        )
      } else {
        console.error('Error handling report:', error)
        Toast.fire('Error', 'Something went wrong.', 'error')
      }
    }
  }

  // Open delete confirmation modal
  const handleDeleteClick = useCallback(() => {
    openDeleteModal(selectedReport, modalState.itemType, () => deleteReportWithAlert)
  }, [openDeleteModal, selectedReport, modalState.itemType, deleteReportWithAlert])

  return (
    <div className="modal-container">
      <div className="modal-card">
        <ModalGenericsClose onClose={closeModals} />
        <ModalGenericsTitle
          readonly={modalState.readonly}
          selectedItem={selectedReport}
          itemType={modalState.itemType}
        />
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="report-form">
            <fieldset className="report-fields">
              <FormField label="Vehicle" error={touched.vehicle && errors.vehicle}>
                <select
                  className={touched.vehicle && errors.vehicle ? 'invalid' : 'valid'}
                  name="vehicle"
                  value={data.vehicle}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  disabled={modalState.readonly}
                >
                  <option value="">Select a vehicle</option>
                  {vehicles?.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.__str__}&nbsp;-&nbsp;
                      {getOwnerNameByVehicleId(vehicle.id, vehicles, owners)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status" error={touched.status && errors.status}>
                <select
                  className={touched.status && errors.status ? 'invalid' : 'valid'}
                  name="status"
                  value={data.status}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  disabled={modalState.readonly}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </FormField>

              <FormField label="Remarks" error={touched.remarks && errors.remarks}>
                <textarea
                  name="remarks"
                  value={data.remarks}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter remarks"
                  disabled={modalState.readonly}
                />
              </FormField>
            </fieldset>
            <div className="input-divider"></div>
            <div className="tasks-and-parts">
              {/* Tasks select */}
              <TaskFieldset
                errors={errors}
                touched={touched}
                loading={loading}
                selectedTaskId={selectedTaskId}
                taskIds={taskIds}
                modalState={modalState}
                taskTemplates={taskTemplates}
                handleTaskChange={handleTaskChange}
                handleBlur={handleBlur}
                addTask={addTask}
                removeTask={removeTask}
              />

              {/* Parts select */}
              <PartFieldset
                errors={errors}
                touched={touched}
                loading={loading}
                selectedPartId={selectedPartId}
                partsUsed={partsUsed}
                quantityPart={quantityPart}
                modalState={modalState}
                inventory={inventory}
                handlePartChange={handlePartChange}
                handleBlur={handleBlur}
                addPart={addPart}
                removePart={removePart}
                handleQuantityChange={handleQuantityChange}
              />
            </div>
          </div>
          <div className="button-group">
            {selectedReport ? (
              <>
                {modalState.readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Report
                  </button>
                ) : (
                  <button type="submit" disabled={modalState.readonly || !isValid || loading}>
                    Update Report
                  </button>
                )}
                <button type="button" onClick={handleDeleteClick}>
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={modalState.readonly || !isValid || loading}>
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
