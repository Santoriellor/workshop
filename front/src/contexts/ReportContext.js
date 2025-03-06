import React, { createContext, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Contexts
import { useGlobalContext } from "../contexts/GlobalContext";
// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import { Toast } from "../utils/sweetalert";

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
  const createReportWithAlert = async (reportData) => {
    const newReport = await createReport(reportData);
    if (newReport) {
      Toast.fire({
        icon: "success",
        title: "Report created successfully!",
      });
    }
    return newReport;
  };

  // Update a report with success alert
  const updateReportWithAlert = async (reportId, updatedFields) => {
    const updatedReport = await updateReport(reportId, updatedFields);
    if (updatedReport) {
      Toast.fire({
        icon: "success",
        title: "Report updated successfully!",
      });
    }
    return updatedReport;
  };

  // Delete a report with success alert
  const deleteReportWithAlert = async (reportId) => {
    const success = await deleteReport(reportId);
    if (success) {
      Toast.fire({
        icon: "success",
        title: "Report deleted successfully!",
      });
    }
    return success;
  };

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
    fetchReports();
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
