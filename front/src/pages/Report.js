import { useState } from "react";
// Utils
import getFilterOptions from "../utils/filterBarFilterOptions";
// Components
import Page from "../components/Page";
import ReportCard from "../components/ReportCard";
import ReportModal from "../components/ReportModal";
// Contexts
import { useReportContext } from "../contexts/ReportContext";
// Styles
import "../styles/Report.css";

const Report = () => {
  const { reports, deleteReportWithAlert } = useReportContext();
  const [filters, setFilters] = useState({
    vehicle: "",
    user: "",
    created_at: "",
    owner: "",
    status: "",
  });

  return (
    <Page
      itemType="Report"
      filters={{ ...filters, type: "report" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).reports}
      sortingCardFunction={(a, b) => b.status.localeCompare(a.status)}
      items={reports}
      deleteItemWithAlert={deleteReportWithAlert}
      CardComponent={ReportCard}
      ModalComponent={ReportModal}
    />
  );
};

export default Report;
