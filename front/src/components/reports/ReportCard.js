import { useLocation } from "react-router-dom";
// Components
import ReportModal from "./ReportModal";
// Contexts
import { useUserContext } from "../../contexts/UserContext";
import { useOwnerContext } from "../../contexts/OwnerContext";
import { useVehicleContext } from "../../contexts/VehicleContext";
import { useGlobalContext } from "../../contexts/GlobalContext";
import { useReportContext } from "../../contexts/ReportContext";

const ReportCard = ({ item, handleExportClick }) => {
  const location = useLocation();
  const isPathReports = location.pathname.includes("report");
  const isPathDashboard = location.pathname.includes("dashboard");
  const isPathInvoices = location.pathname.includes("invoices");

  const itemType = "Report";

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
          openModal(ReportModal, item, itemType, true);
        }
      }}
    >
      {!isPathInvoices && (
        <div className="status">
          {item.status === "pending" ? (
            <svg
              className="status-icon pending"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 3.75C10.44 3.75 9.35 4.8 8.3 6.25C7.25 7.7 6.2 9.55 4.8 12L4.4 12.7C3.2 14.9 2.3 16.5 1.9 17.7C1.5 18.8 1.6 19.5 1.9 19.9C2.2 20.3 2.8 20.6 4 20.7C5.2 20.9 7 21 9.8 21H14.2C17 21 18.8 20.9 20 20.7C21.2 20.6 21.8 20.3 22.1 19.9C22.4 19.5 22.5 18.8 22.1 17.7C21.7 16.5 20.8 14.9 19.6 12.7L19.2 12C17.8 9.55 16.75 7.7 15.7 6.25C14.65 4.8 13.56 3.75 12 3.75Z"
                fill="white"
              />
              <path d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V8C11.25 7.58579 11.5858 7.25 12 7.25Z" />
              <path d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" />
              <path d="M8.2944 4.47643C9.36631 3.11493 10.5018 2.25 12 2.25C13.4981 2.25 14.6336 3.11493 15.7056 4.47643C16.7598 5.81544 17.8769 7.79622 19.3063 10.3305L19.7418 11.1027C20.9234 13.1976 21.8566 14.8523 22.3468 16.1804C22.8478 17.5376 22.9668 18.7699 22.209 19.8569C21.4736 20.9118 20.2466 21.3434 18.6991 21.5471C17.1576 21.75 15.0845 21.75 12.4248 21.75H11.5752C8.91552 21.75 6.84239 21.75 5.30082 21.5471C3.75331 21.3434 2.52637 20.9118 1.79099 19.8569C1.03318 18.7699 1.15218 17.5376 1.65314 16.1804C2.14334 14.8523 3.07658 13.1977 4.25818 11.1027L4.69361 10.3307C6.123 7.79629 7.24019 5.81547 8.2944 4.47643ZM9.47297 5.40432C8.49896 6.64148 7.43704 8.51988 5.96495 11.1299L5.60129 11.7747C4.37507 13.9488 3.50368 15.4986 3.06034 16.6998C2.6227 17.8855 2.68338 18.5141 3.02148 18.9991C3.38202 19.5163 4.05873 19.8706 5.49659 20.0599C6.92858 20.2484 8.9026 20.25 11.6363 20.25H12.3636C15.0974 20.25 17.0714 20.2484 18.5034 20.0599C19.9412 19.8706 20.6179 19.5163 20.9785 18.9991C21.3166 18.5141 21.3773 17.8855 20.9396 16.6998C20.4963 15.4986 19.6249 13.9488 18.3987 11.7747L18.035 11.1299C16.5629 8.51987 15.501 6.64148 14.527 5.40431C13.562 4.17865 12.8126 3.75 12 3.75C11.1874 3.75 10.4379 4.17865 9.47297 5.40432Z" />
            </svg>
          ) : item.status === "in_progress" ? (
            <svg
              className="status-icon in-progress"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M6.5 3.5C7.9 3.3 9.6 3 12 3C14.4 3 16.1 3.3 17.5 3.5C18.8 3.7 19.6 4 20.3 4.7C21 5.4 21.3 6.2 21.5 7.5C21.7 8.9 21.75 10.5 21.75 12C21.75 13.5 21.7 15.1 21.5 16.5C21.3 17.8 21 18.6 20.3 19.3C19.6 20 18.8 20.3 17.5 20.5C16.1 20.7 14.4 21 12 21C9.6 21 7.9 20.7 6.5 20.5C5.2 20.3 4.4 20 3.7 19.3C3 18.6 2.7 17.8 2.5 16.5C2.3 15.1 2.25 13.5 2.25 12C2.25 10.5 2.3 8.9 2.5 7.5C2.7 6.2 3 5.4 3.7 4.7C4.4 4 5.2 3.7 6.5 3.5Z"
                fill="white"
              />
              <path d="M11.9426 1.25H12.0574C14.3658 1.24999 16.1748 1.24998 17.5863 1.43975C19.031 1.63399 20.1711 2.03933 21.0659 2.93414C21.9607 3.82895 22.366 4.96897 22.5603 6.41371C22.75 7.82519 22.75 9.63423 22.75 11.9426V12.0574C22.75 14.3658 22.75 16.1748 22.5603 17.5863C22.366 19.031 21.9607 20.1711 21.0659 21.0659C20.1711 21.9607 19.031 22.366 17.5863 22.5603C16.1748 22.75 14.3658 22.75 12.0574 22.75H11.9426C9.63423 22.75 7.82519 22.75 6.41371 22.5603C4.96897 22.366 3.82895 21.9607 2.93414 21.0659C2.03933 20.1711 1.63399 19.031 1.43975 17.5863C1.24998 16.1748 1.24999 14.3658 1.25 12.0574V11.9426C1.24999 9.63423 1.24998 7.82519 1.43975 6.41371C1.63399 4.96897 2.03933 3.82895 2.93414 2.93414C3.82895 2.03933 4.96897 1.63399 6.41371 1.43975C7.82519 1.24998 9.63423 1.24999 11.9426 1.25ZM6.61358 2.92637C5.33517 3.09825 4.56445 3.42514 3.9948 3.9948C3.42514 4.56445 3.09825 5.33517 2.92637 6.61358C2.75159 7.91356 2.75 9.62177 2.75 12C2.75 14.3782 2.75159 16.0864 2.92637 17.3864C3.09825 18.6648 3.42514 19.4355 3.9948 20.0052C4.56445 20.5749 5.33517 20.9018 6.61358 21.0736C7.91356 21.2484 9.62177 21.25 12 21.25C14.3782 21.25 16.0864 21.2484 17.3864 21.0736C18.6648 20.9018 19.4355 20.5749 20.0052 20.0052C20.5749 19.4355 20.9018 18.6648 21.0736 17.3864C21.2484 16.0864 21.25 14.3782 21.25 12C21.25 9.62177 21.2484 7.91356 21.0736 6.61358C20.9018 5.33517 20.5749 4.56445 20.0052 3.9948C19.4355 3.42514 18.6648 3.09825 17.3864 2.92637C16.0864 2.75159 14.3782 2.75 12 2.75C9.62177 2.75 7.91356 2.75159 6.61358 2.92637ZM12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V11.6893L15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2626 15.3232 13.9697 15.0303L11.8358 12.8964C11.5468 12.6074 11.4022 12.4629 11.3261 12.2791C11.25 12.0954 11.25 11.891 11.25 11.4822V8C11.25 7.58579 11.5858 7.25 12 7.25Z" />
            </svg>
          ) : (
            <svg
              className="status-icon completed"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="9.25" fill="white" />
              <path d="M16.0303 10.0303C16.3232 9.73744 16.3232 9.26256 16.0303 8.96967C15.7374 8.67678 15.2626 8.67678 14.9697 8.96967L10.5 13.4393L9.03033 11.9697C8.73744 11.6768 8.26256 11.6768 7.96967 11.9697C7.67678 12.2626 7.67678 12.7374 7.96967 13.0303L9.96967 15.0303C10.2626 15.3232 10.7374 15.3232 11.0303 15.0303L16.0303 10.0303Z" />
              <path d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75C17.1086 2.75 21.25 6.89137 21.25 12C21.25 17.1086 17.1086 21.25 12 21.25C6.89137 21.25 2.75 17.1086 2.75 12Z" />
            </svg>
          )}
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
                onClick={() => openModal(ReportModal, item, itemType, false)}
              >
                Edit
              </button>
              <button
                title="Delete Report"
                className="btn btn-delete"
                onClick={() =>
                  openDeleteModal(item, itemType, () => deleteReportWithAlert)
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
