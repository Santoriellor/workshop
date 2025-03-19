import { useState } from "react";

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

  const { invoices, fetchInvoices, loadingInvoices } = useInvoiceContext();
  const { reports, fetchReports, loadingReports, updateReportWithAlert } =
    useReportContext();

  const handleExportClick = async (report) => {
    try {
      await updateReportWithAlert(report.id, {
        ...report,
        status: "exported",
      });

      fetchReports({ status: "completed" }, "vehicle__brand,vehicle__model");
      fetchInvoices({}, "-issued_date");
    } catch (error) {
      console.error("Error exporting report:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    }
  };

  return (
    <>
      {/* Filter bar with filter options */}
      <FilterBar
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
      />
      <div className="invoices">
        <div className="invoices-list">
          {loadingReports ? (
            <p>Loading reports...</p>
          ) : reports.length > 0 ? (
            reports.map((report) => (
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
          {loadingInvoices ? (
            <p>Loading invoices...</p>
          ) : invoices.length > 0 ? (
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
