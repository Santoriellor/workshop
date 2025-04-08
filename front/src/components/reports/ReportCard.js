import { useLocation } from "react-router-dom";
// Components
import ReportModal from "./ReportModal";
import SvgStatus from "../svgGenerics/SvgStatus";
// Contexts
import { useUserContext } from "../../contexts/UserContext";
import { useOwnerContext } from "../../contexts/OwnerContext";
import { useVehicleContext } from "../../contexts/VehicleContext";
import { useGlobalContext } from "../../contexts/GlobalContext";
import { useReportContext } from "../../contexts/ReportContext";

const ReportCard = ({ item, handleExportClick }) => {
  const cardItemType = "Report";

  const location = useLocation();
  const isPathReports = location.pathname.includes("report");
  const isPathDashboard = location.pathname.includes("dashboard");
  const isPathInvoices = location.pathname.includes("invoices");

  const { deleteReportWithAlert } = useReportContext();
  const { openModal, openDeleteModal } = useGlobalContext();
  const { getUserNameById } = useUserContext();
  const { getOwnerNameByVehicleId } = useOwnerContext();
  const { getVehicleInfoByVehicleId } = useVehicleContext();

  // Return a truncated text
  const truncateText = (text, maxLength = 25) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <div
      key={item.id}
      className="card"
      title="View Report"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest(".actions")) {
          openModal(ReportModal, item, cardItemType, true);
        }
      }}
    >
      {!isPathInvoices && (
        <div className="status">
          <SvgStatus status={item.status} />
        </div>
      )}

      <div className="card-content">
        <section>
          <header>
            {truncateText(getVehicleInfoByVehicleId(item.vehicle))}
          </header>
          <div>
            {(isPathReports || isPathInvoices || isPathDashboard) && (
              <>
                <p>
                  <strong>Created Date:</strong>&nbsp;
                  {item.formatted_created_at}
                </p>
                <p>
                  <strong>Owner:</strong>&nbsp;
                  {getOwnerNameByVehicleId(item.vehicle)}
                </p>
              </>
            )}
            {!isPathInvoices && (
              <>
                <p>
                  <strong>Status:</strong>&nbsp;
                  <span
                    style={{
                      color:
                        item.status === "pending"
                          ? "red"
                          : item.status === "in_progress"
                          ? "orange"
                          : "green",
                    }}
                  >
                    {item.status_display}
                  </span>
                </p>
                <p>
                  <strong>Created By:</strong>&nbsp;
                  {getUserNameById(item.user)}
                </p>
              </>
            )}
          </div>
        </section>
        <section className="actions">
          {isPathReports && (
            <>
              <button
                title="Edit Report"
                className="btn btn-edit"
                onClick={() =>
                  openModal(ReportModal, item, cardItemType, false)
                }
              >
                Edit
              </button>
              <button
                title="Delete Report"
                className="btn btn-delete"
                onClick={() =>
                  openDeleteModal(
                    item,
                    cardItemType,
                    () => deleteReportWithAlert
                  )
                }
              >
                Delete
              </button>
            </>
          )}
          {isPathInvoices && item.status === "completed" && (
            <>
              <button
                title="Export Report"
                className="btn btn-edit"
                onClick={() => handleExportClick(item)}
              >
                Invoice and PDF
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
export default ReportCard;
