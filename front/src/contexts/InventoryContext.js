import React, { createContext, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import withSuccessAlert from "../utils/successAlert";

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const location = useLocation();
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

  // Fetch data on load
  useEffect(() => {
    fetchInventory({}, "name");
    fetchTaskTemplate({}, "name");
  }, []);

  // Fetch data when pathname change
  useEffect(() => {
    if (location.pathname === "/inventory") {
      fetchInventory({}, "name");
    }
    if (location.pathname === "/tasktemplate") {
      fetchTaskTemplate({}, "name");
    }
  }, [location.pathname]);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        fetchInventory,
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
