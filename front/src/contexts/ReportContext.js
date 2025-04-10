import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
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
  const { modalState } = useGlobalContext();

  const getReportFilters = (pathname) => {
    let filters = {};
    let ordering = "vehicle__brand,vehicle__model";
    let limit = null;
    let offset = null;

    if (pathname.includes("report")) {
      filters = { status__in: ["pending", "in_progress", "completed"] };
    }
    if (pathname.includes("dashboard")) {
      filters = { status__in: ["pending", "in_progress", "completed"] };
      ordering = "-created_at";
      limit = 5;
    }
    if (pathname.includes("invoices")) {
      filters = { status: "completed" };
    }

    return { filters, ordering, limit, offset };
  };

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
  } = useCRUD("tasks", "reports", modalState.selectedItem?.id);

  const {
    data: parts,
    fetchData: fetchParts,
    createItem: createPart,
    updateItem: updatePart,
    deleteItem: deletePart,
    loading: loadingParts,
    error: errorParts,
  } = useCRUD("parts", "reports", modalState.selectedItem?.id);

  // Memoized function to fetch reports
  const fetchReportsMemoized = useCallback(() => {
    fetchReports({}, "vehicle__brand,vehicle__model");
  }, [fetchReports]);

  // Memoized function to fetch reports
  const fetchTasksAndPartsMemoized = useCallback(() => {
    fetchTasks();
    fetchParts();
  }, [fetchTasks, fetchParts]);

  const prevReportLength = useRef(reports.length);
  const prevPathname = useRef(location.pathname);

  // Fetch reports when the pathname changes
  useEffect(() => {
    const reportPaths = ["/report", "/dashboard", "/invoices"];
    if (reportPaths.includes(location.pathname)) {
      const { filters, ordering, limit, offset } = getReportFilters(
        location.pathname
      );
      fetchReportsMemoized({ ...filters, ordering, limit, offset });
    }
    prevPathname.current = location.pathname;
  }, [location.pathname, reports.length, fetchReportsMemoized]);

  // Fetch reports when a report is added and pathname stays the same
  useEffect(() => {
    const reportPaths = ["/report", "/dashboard", "/invoices"];
    if (
      reportPaths.includes(location.pathname) &&
      location.pathname === prevPathname.current &&
      reports.length > prevReportLength.current
    ) {
      const { filters, ordering, limit, offset } = getReportFilters(
        location.pathname
      );
      fetchReportsMemoized({ ...filters, ordering, limit, offset });
    }
    prevReportLength.current = reports.length;
  }, [reports.length, location.pathname, fetchReportsMemoized]);

  // Automatically fetch data when the selectedItem changes
  useEffect(() => {
    const reportPaths = ["/report", "/dashboard", "/invoices"];
    if (
      reportPaths.includes(location.pathname) &&
      modalState.itemType === "Report"
    ) {
      fetchTasksAndPartsMemoized();
    }
  }, [
    modalState.selectedItem,
    modalState.itemType,
    location.pathname,
    fetchTasksAndPartsMemoized,
  ]);

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
