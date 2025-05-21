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

  // Open viewing modal
  const handleCardClick = (e) => {
    // Prevent triggering view mode if clicking on an action button
    if (!e.target.closest('.actions')) {
      openModal(TaskTemplateModal, item, cardItemType, true)
    }
  }
  // Open editing modal
  const handleEditClick = () => {
    openModal(TaskTemplateModal, item, cardItemType, false)
  }
  // Open delete confirmation modal
  const handleDeleteClick = () => {
    openDeleteModal(item, cardItemType, () => deleteTaskTemplateWithAlert)
  }

  return (
    <div key={item.id} className="card" title="View task template" onClick={handleCardClick}>
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
        <section className="actions hide">
          <button title="Edit task" className="btn btn-edit" onClick={handleEditClick}>
            Edit
          </button>
          <button title="Delete task" className="btn btn-delete" onClick={handleDeleteClick}>
            Delete
          </button>
        </section>
      </div>
    </div>
  )
}
export default TaskTemplateCard
