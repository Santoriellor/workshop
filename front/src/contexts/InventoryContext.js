import React, { createContext, useContext, useEffect } from "react";
// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import withSuccessAlert from "../utils/successAlert";

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const {
    data: taskTemplate,
    fetchData: fetchTaskTemplate,
    createItem: createTaskTemplate,
    updateItem: updateTaskTemplate,
    deleteItem: deleteTaskTemplate,
    loading,
    error,
  } = useCRUD("task-templates");

  // Create a task template with success alert
  const createTaskTemplateWithAlert = withSuccessAlert(
    createTaskTemplate,
    "Task created successfully!"
  );
  // Update a task template with success alert
  const updateTaskTemplateWithAlert = withSuccessAlert(
    updateTaskTemplate,
    "Task updated successfully!"
  );
  // Delete a task template with success alert
  const deleteTaskTemplateWithAlert = withSuccessAlert(
    deleteTaskTemplate,
    "Task deleted successfully!"
  );

  const {
    data: inventory,
    fetchData: fetchInventory,
    createItem: createInventoryPart,
    updateItem: updateInventoryPart,
    deleteItem: deleteInventoryPart,
    /* loading,
    error, */
  } = useCRUD("inventory");

  // Create an inventory reference with success alert
  const createInventoryPartWithAlert = withSuccessAlert(
    createInventoryPart,
    "Part created successfully!"
  );
  // Update an inventory reference with success alert
  const updateInventoryPartWithAlert = withSuccessAlert(
    updateInventoryPart,
    "Part updated successfully!"
  );
  // Delete an inventory reference with success alert
  const deleteInventoryPartWithAlert = withSuccessAlert(
    deleteInventoryPart,
    "Part deleted successfully!"
  );

  // Automatically fetch data on first load
  useEffect(() => {
    fetchTaskTemplate();
    fetchInventory();
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        createInventoryPartWithAlert,
        updateInventoryPartWithAlert,
        deleteInventoryPartWithAlert,
        taskTemplate,
        createTaskTemplateWithAlert,
        updateTaskTemplateWithAlert,
        deleteTaskTemplateWithAlert,
        loading,
        error,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

// Custom hook for accessing the InventoryContext
export const useInventoryContext = () => useContext(InventoryContext);
