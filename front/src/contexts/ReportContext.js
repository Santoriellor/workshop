import React, { createContext, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Contexts
import { useGlobalContext } from "./GlobalContext";
// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import withSuccessAlert from "../utils/successAlert";

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const location = useLocation();
  const { selectedItem } = useGlobalContext();

  const {
    data: reports,
    fetchData: fetchReports,
    createItem: createReport,
    updateItem: updateReport,
    deleteItem: deleteReport,
    loading: loadingReports,
    error: errorReports,
  } = useCRUD("reports");

  // Create a report with success alert
  const createReportWithAlert = withSuccessAlert(
    createReport,
    "Report created successfully!"
  );
  // Update a report with success alert
  const updateReportWithAlert = withSuccessAlert(
    updateReport,
    "Report updated successfully!",
    "Report exported and PDF generated successfully!"
  );
  // Delete a report with success alert
  const deleteReportWithAlert = withSuccessAlert(
    deleteReport,
    "Report deleted successfully!"
  );

  const {
    data: tasks,
    fetchData: fetchTasks,
    createItem: createTask,
    updateItem: updateTask,
    deleteItem: deleteTask,
    loading: loadingTasks,
    error: errorTasks,
  } = useCRUD("tasks", "reports", selectedItem?.id);

  const {
    data: parts,
    fetchData: fetchParts,
    createItem: createPart,
    updateItem: updatePart,
    deleteItem: deletePart,
    loading: loadingParts,
    error: errorParts,
  } = useCRUD("parts", "reports", selectedItem?.id);

  useEffect(() => {
    fetchReports({}, "vehicle__brand, vehicle__model");
  }, []);

  // Automatically fetch data when the selectedItem changes
  useEffect(() => {
    if (location.pathname.includes("reports")) {
      fetchTasks();
      fetchParts();
    }
  }, [selectedItem]);

  return (
    <ReportContext.Provider
      value={{
        reports,
        fetchReports,
        loadingReports,
        errorReports,
        createReportWithAlert,
        updateReportWithAlert,
        deleteReportWithAlert,
        tasks,
        fetchTasks,
        loadingTasks,
        errorTasks,
        createTask,
        updateTask,
        deleteTask,
        parts,
        fetchParts,
        loadingParts,
        errorParts,
        createPart,
        updatePart,
        deletePart,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

// Custom hook for accessing the ReportContext
export const useReportContext = () => useContext(ReportContext);
