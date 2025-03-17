import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Contexts
import { useAuth } from "../../contexts/AuthContext";
import { useGlobalContext } from "../../contexts/GlobalContext";
import { useReportContext } from "../../contexts/ReportContext";
import { useVehicleContext } from "../../contexts/VehicleContext";
import { useOwnerContext } from "../../contexts/OwnerContext";
import { useInventoryContext } from "../../contexts/InventoryContext";
// Utils
import { Toast } from "../../utils/sweetalert";
// Styles
import "../../styles/Modal.css";
import "../../styles/ReportModal.css";

const ReportModal = () => {
  const location = useLocation();

  const itemType = "Report";

  const { authenticatedUser } = useAuth();
  const {
    selectedItem,
    setSelectedItem,
    readonly,
    setReadonly,
    openDeleteModal,
    closeModals,
  } = useGlobalContext();

  const handleExportClick = () => {
    console.log("export", selectedItem.id);
  };

  const {
    createReportWithAlert,
    updateReportWithAlert,
    deleteReportWithAlert,
    tasks,
    fetchTasks,
    loadingTasks,
    createTask,
    deleteTask,
    parts,
    fetchParts,
    loadingParts,
    createPart,
    deletePart,
  } = useReportContext();
  const { vehicles } = useVehicleContext();
  const { getOwnerNameByVehicleId } = useOwnerContext();
  const { inventory, taskTemplate } = useInventoryContext();

  const [reportData, setReportData] = useState({
    vehicle: selectedItem?.vehicle || "",
    user: authenticatedUser.id,
    status: selectedItem?.status || "pending",
    remarks: selectedItem?.remarks || "",
  });

  const [selectedTask, setSelectedTask] = useState("");
  const [selectedPart, setSelectedPart] = useState("");
  const [quantityPart, setQuantityPart] = useState("1");
  const [updatedTasks, setUpdatedTasks] = useState(tasks || []);
  const [updatedParts, setUpdatedParts] = useState(parts || []);

  const handleReportChange = (e) => {
    const { name, value } = e.target;

    setReportData({
      ...reportData,
      [name]: name === "vehicle" ? Number(value) : value,
    });
  };
  const handleTaskChange = (e) => {
    setSelectedTask(e.target.value);
  };
  const handlePartChange = (e) => {
    setSelectedPart(e.target.value);
  };
  const handleQuantityChange = (e) => {
    setQuantityPart(e.target.value);
  };

  const addTask = () => {
    if (!selectedTask) {
      Toast.fire("Error", "Please select a repair task.", "error");
      return;
    }

    const taskId = Number(selectedTask);
    const task = taskTemplate.find((item) => item.id === taskId);
    if (!task) return;

    setUpdatedTasks([...updatedTasks, { task_template: task.id }]);

    setSelectedTask("");
  };
  const addPart = () => {
    if (!selectedPart) {
      Toast.fire("Error", "Please select a repair part.", "error");
      return;
    }

    const partId = Number(selectedPart);
    const part = inventory.find((item) => item.id === partId);
    if (!part) return;

    setUpdatedParts([
      ...updatedParts,
      { part: part.id, quantity_used: Number(quantityPart) },
    ]);

    setSelectedPart("");
  };
  const removeTask = (taskIndex) => {
    setUpdatedTasks((prevTasks) =>
      prevTasks.filter((_, index) => index !== taskIndex)
    );
  };
  const removePart = (partIndex) => {
    setUpdatedParts((prevParts) =>
      prevParts.filter((_, index) => index !== partIndex)
    );
  };
  const getTaskById = (taskTemplateId) => {
    const task = taskTemplate.find((item) => item.id === taskTemplateId);
    if (!task) return;
    return task;
  };
  const getPartById = (partId) => {
    const task = inventory.find((item) => item.id === partId);
    if (!task) return;
    return task;
  };

  const toggleReadonly = (e) => {
    e.preventDefault();
    setReadonly(!readonly);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!reportData.vehicle) {
      Toast.fire("Error", "Please select a vehicle.", "error");
      return;
    }

    try {
      const newReport = await createReportWithAlert(reportData);
      if (newReport && updatedTasks.length > 0) {
        try {
          await Promise.all(
            updatedTasks.map((task) =>
              createTask({ ...task, report: newReport.id })
            )
          );
        } catch (error) {
          console.error("Error creating tasks:", error);
        } finally {
          setUpdatedTasks([]);
        }
      }
      if (newReport && updatedParts.length > 0) {
        try {
          await Promise.all(
            updatedParts.map((part) =>
              createPart({
                ...part,
                report: newReport.id,
              })
            )
          );
        } catch (error) {
          console.error("Error creating parts:", error);
        } finally {
          setUpdatedParts([]);
        }
      }
      closeModals();
    } catch (error) {
      console.error("Error creating report:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!reportData.vehicle) {
      Toast.fire("Error", "Please select a vehicle.", "error");
      return;
    }

    try {
      const updatedReport = await updateReportWithAlert(
        selectedItem.id,
        reportData
      );

      if (!updatedReport) return;

      // Handle tasks
      try {
        // Find new tasks that are in updatedTasks but not in tasks
        const newTasks = updatedTasks.filter(
          (updatedTask) => !tasks.some((task) => task.id === updatedTask.id)
        );

        // Find deleted tasks that are in tasks but not in updatedTasks
        const deletedTasks = tasks.filter(
          (task) =>
            !updatedTasks.some((updatedTask) => updatedTask.id === task.id)
        );
        // Handle new tasks and deleted tasks
        if (newTasks.length > 0) {
          await Promise.all(
            newTasks.map((task) =>
              createTask({ ...task, report: updatedReport.id })
            )
          );
        }
        if (deletedTasks.length > 0) {
          await Promise.all(deletedTasks.map((task) => deleteTask(task.id)));
        }
      } catch (error) {
        console.error("Error updating tasks:", error);
      }

      // Handle Parts
      try {
        // Find new parts that are in updatedParts but not in parts
        const newParts = updatedParts.filter(
          (updatedPart) => !parts.some((part) => part.id === updatedPart.id)
        );
        // Find deleted parts that are in parts but not in updatedParts
        const deletedParts = parts.filter(
          (part) =>
            !updatedParts.some((updatedPart) => updatedPart.id === part.id)
        );
        // Handle new parts and deleted parts
        if (newParts.length > 0) {
          await Promise.all(
            newParts.map((part) =>
              createPart({
                ...part,
                report: updatedReport.id,
              })
            )
          );
        }
        if (deletedParts.length > 0) {
          await Promise.all(deletedParts.map((part) => deletePart(part.id)));
        }
      } catch (error) {
        console.error("Error updating parts:", error);
      }
    } catch (error) {
      console.error("Error updating report:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    }
    setSelectedItem(null);
    closeModals();
  };

  // Fetch tasks and parts whenever selectedItem changes
  useEffect(() => {
    if (location.pathname === "/report" && selectedItem?.id) {
      const loadTasksAndParts = async () => {
        const tasksData = await fetchTasks();
        setUpdatedTasks(tasksData || []);

        const partsData = await fetchParts();
        setUpdatedParts(partsData || []);
      };
      loadTasksAndParts();
    } else {
      setUpdatedTasks([]);
      setUpdatedParts([]);
    }
  }, [selectedItem?.id, location.pathname]);

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
          <h2>View Report</h2>
        ) : selectedItem ? (
          <h2>Edit Report</h2>
        ) : (
          <h2>Create Report</h2>
        )}
        <form
          className="modal-form"
          onSubmit={selectedItem ? handleEditSubmit : handleCreateSubmit}
        >
          <div className="report-form">
            <fieldset>
              <label>
                Vehicle:
                <select
                  name="vehicle"
                  value={reportData.vehicle}
                  onChange={handleReportChange}
                  required
                  disabled={readonly}
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.__str__} - {getOwnerNameByVehicleId(vehicle.id)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Status:
                <select
                  name="status"
                  value={reportData.status}
                  onChange={handleReportChange}
                  required
                  disabled={readonly}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label>
                Remarks:
                <textarea
                  name="remarks"
                  value={reportData.remarks}
                  onChange={handleReportChange}
                  placeholder="Enter remarks"
                  disabled={readonly}
                />
              </label>
            </fieldset>
            <fieldset>
              {/* Tasks select */}
              <div>
                <h3>Repair Tasks</h3>
                <div className="repair-section">
                  <select
                    value={selectedTask}
                    onChange={handleTaskChange}
                    disabled={readonly}
                  >
                    <option value="">Select a repair task</option>
                    {taskTemplate.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name} - €{task.price}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="small"
                    onClick={addTask}
                    disabled={readonly}
                  >
                    Add Task
                  </button>
                </div>
                {/* Tasks display */}
                {loadingTasks ? (
                  <span> Loading tasks...</span>
                ) : updatedTasks?.length ? (
                  <ul className="repair-list">
                    {updatedTasks.map((task, index) => (
                      <li key={index}>
                        <p>
                          {getTaskById(task.task_template).name} - €
                          {getTaskById(task.task_template).price}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          disabled={readonly}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M10.3094 2.25002H13.6908C13.9072 2.24988 14.0957 2.24976 14.2737 2.27819C14.977 2.39049 15.5856 2.82915 15.9146 3.46084C15.9978 3.62073 16.0573 3.79961 16.1256 4.00494L16.2373 4.33984C16.2562 4.39653 16.2616 4.41258 16.2661 4.42522C16.4413 4.90933 16.8953 5.23659 17.4099 5.24964C17.4235 5.24998 17.44 5.25004 17.5001 5.25004H20.5001C20.9143 5.25004 21.2501 5.58582 21.2501 6.00004C21.2501 6.41425 20.9143 6.75004 20.5001 6.75004H3.5C3.08579 6.75004 2.75 6.41425 2.75 6.00004C2.75 5.58582 3.08579 5.25004 3.5 5.25004H6.50008C6.56013 5.25004 6.5767 5.24998 6.59023 5.24964C7.10488 5.23659 7.55891 4.90936 7.73402 4.42524C7.73863 4.41251 7.74392 4.39681 7.76291 4.33984L7.87452 4.00496C7.94281 3.79964 8.00233 3.62073 8.08559 3.46084C8.41453 2.82915 9.02313 2.39049 9.72643 2.27819C9.90445 2.24976 10.093 2.24988 10.3094 2.25002ZM9.00815 5.25004C9.05966 5.14902 9.10531 5.04404 9.14458 4.93548C9.1565 4.90251 9.1682 4.86742 9.18322 4.82234L9.28302 4.52292C9.37419 4.24941 9.39519 4.19363 9.41601 4.15364C9.52566 3.94307 9.72853 3.79686 9.96296 3.75942C10.0075 3.75231 10.067 3.75004 10.3553 3.75004H13.6448C13.9331 3.75004 13.9927 3.75231 14.0372 3.75942C14.2716 3.79686 14.4745 3.94307 14.5842 4.15364C14.605 4.19363 14.626 4.2494 14.7171 4.52292L14.8169 4.82216L14.8556 4.9355C14.8949 5.04405 14.9405 5.14902 14.992 5.25004H9.00815Z" />
                            <path d="M5.91509 8.45015C5.88754 8.03685 5.53016 7.72415 5.11686 7.7517C4.70357 7.77925 4.39086 8.13663 4.41841 8.54993L4.88186 15.5017C4.96736 16.7844 5.03642 17.8205 5.19839 18.6336C5.36679 19.4789 5.65321 20.185 6.2448 20.7385C6.8364 21.2919 7.55995 21.5308 8.4146 21.6425C9.23662 21.7501 10.275 21.7501 11.5606 21.75H12.4395C13.7251 21.7501 14.7635 21.7501 15.5856 21.6425C16.4402 21.5308 17.1638 21.2919 17.7554 20.7385C18.347 20.185 18.6334 19.4789 18.8018 18.6336C18.9638 17.8206 19.0328 16.7844 19.1183 15.5017L19.5818 8.54993C19.6093 8.13663 19.2966 7.77925 18.8833 7.7517C18.47 7.72415 18.1126 8.03685 18.0851 8.45015L17.6251 15.3493C17.5353 16.6971 17.4713 17.6349 17.3307 18.3406C17.1943 19.025 17.004 19.3873 16.7306 19.6431C16.4572 19.8989 16.083 20.0647 15.391 20.1552C14.6776 20.2485 13.7376 20.25 12.3868 20.25H11.6134C10.2626 20.25 9.32255 20.2485 8.60915 20.1552C7.91715 20.0647 7.54299 19.8989 7.26958 19.6431C6.99617 19.3873 6.80583 19.025 6.66948 18.3406C6.52892 17.6349 6.46489 16.6971 6.37503 15.3493L5.91509 8.45015Z" />
                            <path d="M9.42546 10.2538C9.83762 10.2125 10.2052 10.5133 10.2464 10.9254L10.7464 15.9254C10.7876 16.3376 10.4869 16.7051 10.0747 16.7463C9.66256 16.7875 9.29503 16.4868 9.25381 16.0747L8.75381 11.0747C8.7126 10.6625 9.01331 10.295 9.42546 10.2538Z" />
                            <path d="M14.5747 10.2538C14.9869 10.295 15.2876 10.6625 15.2464 11.0747L14.7464 16.0747C14.7052 16.4868 14.3376 16.7875 13.9255 16.7463C13.5133 16.7051 13.2126 16.3376 13.2538 15.9254L13.7538 10.9254C13.795 10.5133 14.1626 10.2125 14.5747 10.2538Z" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>No tasks available</span>
                )}
              </div>
              {/* Parts select */}
              <div>
                <h3>Repair Parts</h3>
                <div className="repair-section">
                  <select
                    value={selectedPart}
                    onChange={handlePartChange}
                    disabled={readonly}
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
                    value={selectedPart.quantity_used}
                    onChange={handleQuantityChange}
                    defaultValue="1"
                    disabled={readonly}
                  />
                  <button
                    type="button"
                    className="small"
                    onClick={addPart}
                    disabled={readonly}
                  >
                    Add Part
                  </button>
                </div>
                {/* Parts display */}
                {loadingParts ? (
                  <span> Loading parts...</span>
                ) : updatedParts?.length ? (
                  <ul className="repair-list">
                    {updatedParts.map((part, index) => (
                      <li key={index}>
                        <p>
                          {part.quantity_used}x&nbsp;
                          {getPartById(part.part).name} - €
                          {getPartById(part.part).unit_price}
                        </p>
                        <button
                          title="Remove Part"
                          type="button"
                          onClick={() => removePart(index)}
                          disabled={readonly}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M10.3094 2.25002H13.6908C13.9072 2.24988 14.0957 2.24976 14.2737 2.27819C14.977 2.39049 15.5856 2.82915 15.9146 3.46084C15.9978 3.62073 16.0573 3.79961 16.1256 4.00494L16.2373 4.33984C16.2562 4.39653 16.2616 4.41258 16.2661 4.42522C16.4413 4.90933 16.8953 5.23659 17.4099 5.24964C17.4235 5.24998 17.44 5.25004 17.5001 5.25004H20.5001C20.9143 5.25004 21.2501 5.58582 21.2501 6.00004C21.2501 6.41425 20.9143 6.75004 20.5001 6.75004H3.5C3.08579 6.75004 2.75 6.41425 2.75 6.00004C2.75 5.58582 3.08579 5.25004 3.5 5.25004H6.50008C6.56013 5.25004 6.5767 5.24998 6.59023 5.24964C7.10488 5.23659 7.55891 4.90936 7.73402 4.42524C7.73863 4.41251 7.74392 4.39681 7.76291 4.33984L7.87452 4.00496C7.94281 3.79964 8.00233 3.62073 8.08559 3.46084C8.41453 2.82915 9.02313 2.39049 9.72643 2.27819C9.90445 2.24976 10.093 2.24988 10.3094 2.25002ZM9.00815 5.25004C9.05966 5.14902 9.10531 5.04404 9.14458 4.93548C9.1565 4.90251 9.1682 4.86742 9.18322 4.82234L9.28302 4.52292C9.37419 4.24941 9.39519 4.19363 9.41601 4.15364C9.52566 3.94307 9.72853 3.79686 9.96296 3.75942C10.0075 3.75231 10.067 3.75004 10.3553 3.75004H13.6448C13.9331 3.75004 13.9927 3.75231 14.0372 3.75942C14.2716 3.79686 14.4745 3.94307 14.5842 4.15364C14.605 4.19363 14.626 4.2494 14.7171 4.52292L14.8169 4.82216L14.8556 4.9355C14.8949 5.04405 14.9405 5.14902 14.992 5.25004H9.00815Z" />
                            <path d="M5.91509 8.45015C5.88754 8.03685 5.53016 7.72415 5.11686 7.7517C4.70357 7.77925 4.39086 8.13663 4.41841 8.54993L4.88186 15.5017C4.96736 16.7844 5.03642 17.8205 5.19839 18.6336C5.36679 19.4789 5.65321 20.185 6.2448 20.7385C6.8364 21.2919 7.55995 21.5308 8.4146 21.6425C9.23662 21.7501 10.275 21.7501 11.5606 21.75H12.4395C13.7251 21.7501 14.7635 21.7501 15.5856 21.6425C16.4402 21.5308 17.1638 21.2919 17.7554 20.7385C18.347 20.185 18.6334 19.4789 18.8018 18.6336C18.9638 17.8206 19.0328 16.7844 19.1183 15.5017L19.5818 8.54993C19.6093 8.13663 19.2966 7.77925 18.8833 7.7517C18.47 7.72415 18.1126 8.03685 18.0851 8.45015L17.6251 15.3493C17.5353 16.6971 17.4713 17.6349 17.3307 18.3406C17.1943 19.025 17.004 19.3873 16.7306 19.6431C16.4572 19.8989 16.083 20.0647 15.391 20.1552C14.6776 20.2485 13.7376 20.25 12.3868 20.25H11.6134C10.2626 20.25 9.32255 20.2485 8.60915 20.1552C7.91715 20.0647 7.54299 19.8989 7.26958 19.6431C6.99617 19.3873 6.80583 19.025 6.66948 18.3406C6.52892 17.6349 6.46489 16.6971 6.37503 15.3493L5.91509 8.45015Z" />
                            <path d="M9.42546 10.2538C9.83762 10.2125 10.2052 10.5133 10.2464 10.9254L10.7464 15.9254C10.7876 16.3376 10.4869 16.7051 10.0747 16.7463C9.66256 16.7875 9.29503 16.4868 9.25381 16.0747L8.75381 11.0747C8.7126 10.6625 9.01331 10.295 9.42546 10.2538Z" />
                            <path d="M14.5747 10.2538C14.9869 10.295 15.2876 10.6625 15.2464 11.0747L14.7464 16.0747C14.7052 16.4868 14.3376 16.7875 13.9255 16.7463C13.5133 16.7051 13.2126 16.3376 13.2538 15.9254L13.7538 10.9254C13.795 10.5133 14.1626 10.2125 14.5747 10.2538Z" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>No parts available</span>
                )}
              </div>
            </fieldset>
          </div>
          <div className="button-group">
            {selectedItem ? (
              <>
                {readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Report
                  </button>
                ) : (
                  <button type="submit" disabled={readonly}>
                    Update Report
                  </button>
                )}
                {selectedItem.status === "completed" && (
                  <button type="button" onClick={handleExportClick}>
                    Export
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      selectedItem,
                      itemType,
                      () => deleteReportWithAlert
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={readonly}>
                Create Report
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
