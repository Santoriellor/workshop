import { useState, useMemo } from "react";

// Contexts
import { useInvoiceContext } from "../contexts/InvoiceContext";
import { useReportContext } from "../contexts/ReportContext";
import { useVehicleContext } from "../contexts/VehicleContext";
// Components
import ReportCard from "../components/reports/ReportCard";
import InvoiceCard from "../components/invoices/InvoiceCard";
import FilterBar from "../components/FilterBar";
// Utils
import { Toast } from "../utils/sweetalert";
import getFilterOptions from "../utils/filterBarFilterOptions";
import { filterItems } from "../utils/pageItemFilter";
// Styles
import "../styles/Cards.css";
import "../styles/Invoices.css";

const Invoices = () => {
  const [filters, setFilters] = useState({
    type: "",
    vehicle: "",
    user: "",
    created_at: "",
    owner: "",
    status: "",
    formatted_issued_date: "",
  });
  const filterOptions = getFilterOptions(filters).invoices;

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  const { invoices, fetchInvoices, loadingInvoices } = useInvoiceContext();
  const { reports, fetchReports, loadingReports, updateReportWithAlert } =
    useReportContext();
  const { vehicles, getVehicleInfoByVehicleId } = useVehicleContext();

  // Filter reports based on filters
  const filteredReports = useMemo(() => {
    // Filter the items
    let reportsAfterFilter = reports.filter((report) =>
      filterItems(
        report,
        {
          ...filters,
          type: "report",
        },
        vehicles,
        getVehicleInfoByVehicleId
      )
    );

    return reportsAfterFilter;
  }, [reports, filters]);

  // Filter invoices based on filters
  const filteredInvoices = useMemo(() => {
    // Filter the items
    let invoicesAfterFilter = invoices.filter((invoice) =>
      filterItems(invoice, { ...filters, type: "invoices" })
    );

    return invoicesAfterFilter;
  }, [invoices, filters]);

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
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
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
          ) : filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
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
