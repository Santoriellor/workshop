// Components
import FormField from '../../formHelper/FormField'
import SvgTrash from '../../svgGenerics/SvgTrash'
import LoadingScreen from '../../LoadingScreen'

const TaskFieldset = ({
  errors,
  touched,
  loading,
  selectedTaskId,
  taskIds,
  taskTemplates,
  handleTaskChange,
  handleBlur,
  modalState,
  addTask,
  removeTask,
}) => {
  return (
    <fieldset>
      <FormField label="Repair tasks" error={touched.task && errors.tasks}>
        <div className="repair-section">
          <select
            className={touched.task && errors.tasks ? 'invalid' : 'valid'}
            value={selectedTaskId ?? ''}
            name="task"
            onChange={handleTaskChange}
            onBlur={handleBlur}
            disabled={modalState.readonly}
          >
            <option value="">Select a repair task</option>
            {taskTemplates?.map((taskTemplate) => (
              <option key={taskTemplate.id} value={taskTemplate.id}>
                {taskTemplate.name} - {taskTemplate.price} CHF
              </option>
            ))}
          </select>
          <button
            type="button"
            className="small"
            onClick={addTask}
            disabled={modalState.readonly || !selectedTaskId}
          >
            Add Task
          </button>
        </div>
        {/* Tasks display */}
        {loading ? (
          <LoadingScreen fullscreen={false} small={true} />
        ) : taskIds && taskIds?.length > 0 ? (
          <ul className="repair-list">
            {taskIds?.map((taskId) => {
              const taskTemplate = taskTemplates.find((t) => t.id === taskId)
              return (
                <li key={taskId}>
                  <p>
                    {taskTemplate?.name ?? 'Unknown Task'} - {taskTemplate.price ?? 'N/A'} CHF
                  </p>
                  <button
                    title="Remove task"
                    type="button"
                    onClick={() => removeTask(taskId)}
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
      </FormField>
    </fieldset>
  )
}
export default TaskFieldset
