import { useEffect, useState } from "react";

// Contexts
import { useInvoiceContext } from "../contexts/InvoiceContext";
import { useReportContext } from "../contexts/ReportContext";
// Components
import ReportCard from "../components/reports/ReportCard";
import InvoiceCard from "../components/invoices/InvoiceCard";
import FilterBar from "../components/FilterBar";
// Utils
import { Toast } from "../utils/sweetalert";
import getFilterOptions from "../utils/filterBarFilterOptions";
// Styles
import "../styles/Cards.css";
import "../styles/Invoices.css";

const Invoices = () => {
  const [filters, setFilters] = useState({
    name: "",
    email: "",
  });
  const filterOptions = getFilterOptions(filters).invoices;

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  const { invoices, fetchInvoices } = useInvoiceContext();
  const { reports, fetchReports, updateReportWithAlert } = useReportContext();

  // Select only the non exported reports
  const exportedReports = reports.filter(
    (report) => report.status === "completed"
  );

  const handleExportClick = async (report) => {
    try {
      const updatedReport = await updateReportWithAlert(report.id, {
        ...report,
        status: "exported",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      fetchReports({}, "vehicle__brand, vehicle__model");
      fetchInvoices({}, "issued_date");
    }
  };

  useEffect(() => {
    fetchReports({}, "vehicle__brand, vehicle__model");
    fetchInvoices({}, "issued_date");
  }, []);

  return (
    <>
      {/* Filter bar with filter options */}
      <FilterBar
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
      />
      <div className="invoices">
        <div className="invoices-list">
          {exportedReports.length > 0 ? (
            exportedReports.map((report) => (
              <ReportCard
                key={report.id}
                item={report}
                handleExportClick={handleExportClick}
              ></ReportCard>
            ))
          ) : (
            <p>No completed reports to export.</p>
          )}
        </div>
        <div className="invoices-divider"></div>
        <div className="invoices-list">
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))
          ) : (
            <p>No invoices available.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Invoices;
