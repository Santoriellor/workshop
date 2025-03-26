import { useState, useEffect, useMemo } from "react";

// Contexts
import { useGlobalContext } from "../../contexts/GlobalContext";
import { useInventoryContext } from "../../contexts/InventoryContext";
// Utils
import { Toast } from "../../utils/sweetalert";
import { isTakenTaskName, isValidPrice } from "../../utils/validation";
// Styles
import "../../styles/Modal.css";

const TaskTemplateModal = () => {
  const itemType = "Task template";
  // Error messages
  const [errors, setErrors] = useState({
    name: "This field is required.",
    description: "This field is required.",
    price: "This field is required.",
  });

  const { selectedItem, readonly, setReadonly, openDeleteModal, closeModals } =
    useGlobalContext();
  const {
    createTaskTemplateWithAlert,
    updateTaskTemplateWithAlert,
    deleteTaskTemplateWithAlert,
    taskTemplate,
    loadingTaskTemplate,
  } = useInventoryContext();

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
      closeModals();
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
      await updateTaskTemplateWithAlert(selectedItem.id, taskTemplateData);
    } catch (error) {
      console.error("Error updating task template:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      setTaskTemplateData(null);
      closeModals();
    }
  };

  // Live validation
  const existingTaskNames = taskTemplate
    .map((task) => task.name)
    .filter(
      (name) =>
        !selectedItem || name.toLowerCase() !== selectedItem.name.toLowerCase()
    );

  useEffect(() => {
    const taskTemplateError =
      taskTemplateData.name.trim() === ""
        ? "This field is required."
        : isTakenTaskName(taskTemplateData.name, existingTaskNames);
    setErrors((prevErrors) =>
      prevErrors.name !== taskTemplateError
        ? { ...prevErrors, name: taskTemplateError }
        : prevErrors
    );
  }, [taskTemplateData.name]);

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      description: taskTemplateData.description
        ? ""
        : "This field is required.",
    }));
  }, [taskTemplateData.description]);

  useEffect(() => {
    const priceError =
      taskTemplateData.price.trim() === ""
        ? "This field is required."
        : isValidPrice(taskTemplateData.price);
    setErrors((prevErrors) =>
      prevErrors.price !== priceError
        ? { ...prevErrors, price: priceError }
        : prevErrors
    );
  }, [taskTemplateData.price]);

  const isFormValid = useMemo(
    () =>
      !errors.name &&
      !errors.description &&
      !errors.price &&
      taskTemplateData.name &&
      taskTemplateData.description &&
      taskTemplateData.price,
    [errors, taskTemplateData]
  );

  return (
    <div className="modal-container">
      <div className="modal-card">
        <svg
          onClick={closeModals}
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
              <span>Name:</span>
              <input
                className={errors.name ? "invalid" : "valid"}
                type="text"
                name="name"
                value={taskTemplateData.name}
                onChange={handleTaskTemplateChange}
                placeholder="Enter name"
                required
                disabled={readonly}
              />
              <p className="error-text">{errors.name && <>{errors.name}</>}</p>
            </label>

            <label>
              <span>Description:</span>
              <input
                className={errors.description ? "invalid" : "valid"}
                type="textarea"
                name="description"
                value={taskTemplateData.description}
                onChange={handleTaskTemplateChange}
                placeholder="Please describe the task"
                required
                disabled={readonly}
              />
              <p className="error-text">
                {errors.description && <>{errors.description}</>}
              </p>
            </label>

            <label>
              <span>Price:</span>
              <input
                className={errors.price ? "invalid" : "valid"}
                type="text"
                name="price"
                value={taskTemplateData.price}
                onChange={handleTaskTemplateChange}
                placeholder="Enter price"
                disabled={readonly}
              />
              <p className="error-text">
                {errors.price && <>{errors.price}</>}
              </p>
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
                  <button
                    type="submit"
                    disabled={readonly || !isFormValid || loadingTaskTemplate}
                  >
                    Update Task
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      selectedItem,
                      itemType,
                      () => deleteTaskTemplateWithAlert
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={readonly || !isFormValid || loadingTaskTemplate}
              >
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
