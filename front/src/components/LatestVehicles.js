import { useNavigate } from "react-router-dom";

// Contexts
import { useVehicleContext } from "../contexts/VehicleContext";
// Components
import VehicleCard from "./VehicleCard";

const LatestVehicles = () => {
  const navigate = useNavigate();
  const { vehicles } = useVehicleContext();

  const fetchLatestVehicles = (vehicles) => {
    return vehicles
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 5);
  };
  let latestVehicles = fetchLatestVehicles(vehicles);

  const handleViewClick = (type, id) => {
    navigate(`/${type}`, { state: { viewItemId: id } });
  };
  const handleEditClick = (item) => {
    console.log("Edit item", item);
  };
  const handleDeleteClick = (item) => {
    console.log("Delete item", item);
  };

  return (
    <>
      <h3>Latest created vehicles</h3>
      {/* latest vehicles list with card display */}
      <div className="list">
        {latestVehicles.length > 0 ? (
          latestVehicles.map((item) => (
            <VehicleCard
              key={item.id}
              item={item}
              handleViewClick={() => handleViewClick("vehicle", item.id)}
              handleEditClick={handleEditClick}
              handleDeleteClick={handleDeleteClick}
            />
          ))
        ) : (
          <p>No vehicle match your filters.</p>
        )}
      </div>
    </>
  );
};
export default LatestVehicles;
