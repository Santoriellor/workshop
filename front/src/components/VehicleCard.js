// Contexts
import { useOwnerContext } from "../contexts/OwnerContext";
import { useVehicleContext } from "../contexts/VehicleContext";

const VehicleCard = ({
  item,
  handleViewClick,
  handleEditClick,
  handleDeleteClick,
}) => {
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
      title="View Vehicle"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest(".actions")) {
          handleViewClick(item);
        }
      }}
    >
      <div>
        <h3>{getVehicleInfoByVehicleId(item.id)}</h3>
        <p>
          <strong>Year:</strong>&nbsp;{item.year}
        </p>
        <p>
          <strong>Owner:</strong>&nbsp;
          {getOwnerNameByVehicleId(item.id)}
        </p>
      </div>
      <div className="actions">
        <button className="btn btn-green" onClick={() => handleEditClick(item)}>
          Edit
        </button>
        <button className="btn btn-red" onClick={() => handleDeleteClick(item)}>
          Delete
        </button>
      </div>
    </div>
  );
};
export default VehicleCard;
