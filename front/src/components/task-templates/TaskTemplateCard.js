// Components
import TaskTemplateModal from "./TaskTemplateModal";
// Contexts
import { useInventoryContext } from "../../contexts/InventoryContext";
import { useGlobalContext } from "../../contexts/GlobalContext";

const TaskTemplateCard = ({ item }) => {
  const itemType = "Task template";

  const { deleteTaskTemplateWithAlert } = useInventoryContext();
  const { openModal, openDeleteModal } = useGlobalContext();

  return (
    <div
      key={item.id}
      className="card"
      title="View task template"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest(".actions")) {
          openModal(TaskTemplateModal, item, itemType, true);
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
            onClick={() => openModal(TaskTemplateModal, item, itemType, false)}
          >
            Edit
          </button>
          <button
            title="Delete task"
            className="btn btn-delete"
            onClick={() =>
              openDeleteModal(item, itemType, () => deleteTaskTemplateWithAlert)
            }
          >
            Delete
          </button>
        </section>
      </div>
    </div>
  );
};
export default TaskTemplateCard;
