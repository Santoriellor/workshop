import { useLocation } from "react-router-dom";
// Contexts
import { useOwnerContext } from "../contexts/OwnerContext";
import { useVehicleContext } from "../contexts/VehicleContext";
import { useReportContext } from "../contexts/ReportContext";

const VehicleCard = ({
  item,
  handleViewClick,
  handleEditClick,
  handleDeleteClick,
}) => {
  const location = useLocation();
  const isPathVehicles = location.pathname.includes("vehicle");

  const { getOwnerNameByVehicleId } = useOwnerContext();
  const { getVehicleInfoByVehicleId } = useVehicleContext();
  const { reports } = useReportContext();

  // Return the last time a vehicle was used in a report
  const getLastUsedDate = (vehicleId) => {
    const lastReport = reports
      .filter((report) => report.vehicle === vehicleId)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    return lastReport ? lastReport.formatted_created_at : "N/A";
  };

  // Return a truncated text
  const truncateText = (text, maxLength = 20) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <div
      key={item.id}
      className="card"
      title="View Vehicle"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest(".actions")) {
          handleViewClick(item);
        }
      }}
    >
      <header>{truncateText(getVehicleInfoByVehicleId(item.id))}</header>
      <div>
        {isPathVehicles && (
          <p>
            <strong>Year:</strong>&nbsp;{item.year}
          </p>
        )}
        <p>
          <strong>Owner:</strong>&nbsp;
          {getOwnerNameByVehicleId(item.id)}
        </p>
        {!isPathVehicles && (
          <p>
            <strong>Last used:</strong>&nbsp;{getLastUsedDate(item.id)}
          </p>
        )}
      </div>
      <div className="actions">
        {isPathVehicles && (
          <>
            <button
              title="Edit vehicle"
              className="btn btn-edit"
              onClick={() => handleEditClick(item)}
            >
              Edit
            </button>
            <button
              title="Delete vehicle"
              className="btn btn-delete"
              onClick={() => handleDeleteClick(item)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};
export default VehicleCard;
