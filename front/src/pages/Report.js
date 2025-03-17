import { useState, useEffect } from "react";
// Utils
import getFilterOptions from "../utils/filterBarFilterOptions";
// Components
import Page from "../components/Page";
import ReportCard from "../components/reports/ReportCard";
import ReportModal from "../components/reports/ReportModal";
// Contexts
import { useReportContext } from "../contexts/ReportContext";
import { useGlobalContext } from "../contexts/GlobalContext";
// Styles
import "../styles/Report.css";

const Report = () => {
  const { reports } = useReportContext();
  const { setModalComponent } = useGlobalContext();

  const [filters, setFilters] = useState({
    vehicle: "",
    user: "",
    created_at: "",
    owner: "",
    status: "",
  });

  // Select only the non exported reports
  const nonExportedReports = reports.filter(
    (report) => report.status !== "exported"
  );

  useEffect(() => {
    setModalComponent(() => ReportModal);
  }, []);

  return (
    <Page
      itemType="Report"
      filters={{ ...filters, type: "report" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).reports}
      items={nonExportedReports}
      CardComponent={ReportCard}
    />
  );
};

export default Report;
