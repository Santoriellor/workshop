import React, { createContext, useContext, useEffect } from "react";
// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import { Toast } from "../utils/sweetalert";

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

  const {
    data: inventory,
    fetchData: fetchInventory,
    createItem: createInventoryPart,
    updateItem: updateInventoryPart,
    deleteItem: deleteInventoryPart,
    /* loading,
    error, */
  } = useCRUD("inventory");

  // Automatically fetch data on first load
  useEffect(() => {
    fetchTaskTemplate();
    fetchInventory();
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        createInventoryPart,
        updateInventoryPart,
        deleteInventoryPart,
        taskTemplate,
        createTaskTemplate,
        updateTaskTemplate,
        deleteTaskTemplate,
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
