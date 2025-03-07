import { useState } from "react";

// Contexts
import { useGlobalContext } from "../contexts/GlobalContext";
import { useInventoryContext } from "../contexts/InventoryContext";
// Utils
import { Toast } from "../utils/sweetalert";
// Styles
import "../styles/Modal.css";

const TaskTemplateModal = ({ readonly, setReadonly, onClose, onDelete }) => {
  const { selectedItem } = useGlobalContext();
  const { createTaskTemplateWithAlert, updateTaskTemplateWithAlert } =
    useInventoryContext();

  const [taskTemplateData, setTaskTemplateData] = useState({
    name: selectedItem?.name || "",
    description: selectedItem?.description || "",
    price: selectedItem?.price || "",
  });

  const handleTaskTemplateChange = (e) => {
    const { name, value } = e.target;

    setTaskTemplateData({
      ...taskTemplateData,
      [name]: value,
    });
  };

  const toggleReadonly = (e) => {
    e.preventDefault();
    setReadonly(!readonly);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!taskTemplateData.name) {
      Toast.fire("Error", "Please fill in a task name.", "error");
      return;
    }
    if (!taskTemplateData.description) {
      Toast.fire("Error", "Please fill in a description.", "error");
      return;
    }
    if (!taskTemplateData.price) {
      Toast.fire("Error", "Please fill in a price.", "error");
      return;
    }

    try {
      const newTaskTemplate = await createTaskTemplateWithAlert(
        taskTemplateData
      );
      if (newTaskTemplate) {
        setTaskTemplateData({
          name: "",
          description: "",
          price: "",
        });
      }
    } catch (error) {
      console.error("Error creating task template:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      onClose();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!taskTemplateData.name) {
      Toast.fire("Error", "Please fill in a task name.", "error");
      return;
    }
    if (!taskTemplateData.description) {
      Toast.fire("Error", "Please fill in a description.", "error");
      return;
    }
    if (!taskTemplateData.price) {
      Toast.fire("Error", "Please fill in a price.", "error");
      return;
    }

    try {
      const updatedTaskTemplate = await updateTaskTemplateWithAlert(
        selectedItem.id,
        taskTemplateData
      );
    } catch (error) {
      console.error("Error updating task template:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      setTaskTemplateData(null);
      onClose();
    }
  };

  return (
    <div className="modal-container">
      <div className="modal-card">
        <svg
          onClick={onClose}
          className="modal-card-close"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            width="100%"
            height="100%"
            d="M11.414 10l2.829-2.828a1 1 0 1 0-1.415-1.415L10 8.586 7.172 5.757a1 1 0 0 0-1.415 1.415L8.586 10l-2.829 2.828a1 1 0 0 0 1.415 1.415L10 11.414l2.828 2.829a1 1 0 0 0 1.415-1.415L11.414 10zM10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z"
          />
        </svg>
        {readonly ? (
          <h2>View Task</h2>
        ) : selectedItem ? (
          <h2>Edit Task</h2>
        ) : (
          <h2>Create Task</h2>
        )}
        <form
          className="modal-form"
          onSubmit={selectedItem ? handleEditSubmit : handleCreateSubmit}
        >
          <fieldset>
            <label>
              Name:
              <input
                type="text"
                name="name"
                value={taskTemplateData.name}
                onChange={handleTaskTemplateChange}
                placeholder="Enter name"
                required
                disabled={readonly}
              />
            </label>

            <label>
              Description:
              <input
                type="textarea"
                name="description"
                value={taskTemplateData.description}
                onChange={handleTaskTemplateChange}
                placeholder="Please describe the task"
                required
                disabled={readonly}
              />
            </label>

            <label>
              Price:
              <input
                type="text"
                name="price"
                value={taskTemplateData.price}
                onChange={handleTaskTemplateChange}
                placeholder="Enter price"
                disabled={readonly}
              />
            </label>
          </fieldset>
          <div className="button-group">
            {selectedItem ? (
              <>
                {readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Task
                  </button>
                ) : (
                  <button type="submit" disabled={readonly}>
                    Update Task
                  </button>
                )}
                <button type="button" onClick={onDelete}>
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={readonly}>
                Create Task
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default TaskTemplateModal;
