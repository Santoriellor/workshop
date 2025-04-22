// Components
import TaskTemplateModal from './TaskTemplateModal'
// Zustand
import useTaskTemplateStore from '../../stores/useTaskTemplateStore'
// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Utils
import withSuccessAlert from '../../utils/successAlert'

const TaskTemplateCard = ({ item }) => {
  const cardItemType = 'Task template'

  const { deleteTaskTemplate } = useTaskTemplateStore()
  const { openModal, openDeleteModal } = useGlobalContext()

  // Delete part with alert
  const deleteTaskTemplateWithAlert = withSuccessAlert(
    deleteTaskTemplate,
    'Vehicle deleted successfully!',
  )

  return (
    <div
      key={item.id}
      className="card"
      title="View task template"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest('.actions')) {
          openModal(TaskTemplateModal, item, cardItemType, true)
        }
      }}
    >
      <div className="card-content">
        <section>
          <header>{item.name}</header>
          <div>
            <p>
              <strong>Description:</strong>&nbsp;{item.description}
            </p>
            <p>
              <strong>Price:</strong>&nbsp;{item.price}
            </p>
          </div>
        </section>
        <section className="actions">
          <button
            title="Edit task"
            className="btn btn-edit"
            onClick={() => openModal(TaskTemplateModal, item, cardItemType, false)}
          >
            Edit
          </button>
          <button
            title="Delete task"
            className="btn btn-delete"
            onClick={() => openDeleteModal(item, cardItemType, () => deleteTaskTemplateWithAlert)}
          >
            Delete
          </button>
        </section>
      </div>
    </div>
  )
}
export default TaskTemplateCard
