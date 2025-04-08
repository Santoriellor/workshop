import { useState, useEffect } from "react";
// Utils
import getFilterOptions from "../utils/filterBarFilterOptions";
// Components
import Page from "../components/Page";
import VehicleCard from "../components/vehicles/VehicleCard";
import VehicleModal from "../components/vehicles/VehicleModal";
// Contexts
import { useVehicleContext } from "../contexts/VehicleContext";
import { useGlobalContext } from "../contexts/GlobalContext";
// Styles
import "../styles/Vehicles.css";

const Vehicle = () => {
  const { vehicles, loadingVehicles } = useVehicleContext();
  const { setModalState } = useGlobalContext();

  const [filters, setFilters] = useState({
    brand: "",
    model: "",
    year: "",
    license_plate: "",
    vehicle_owner: "",
  });

  useEffect(() => {
    setModalState((prev) => ({
      ...prev,
      modalComponent: VehicleModal,
    }));
  }, []);

  return (
    <Page
      itemType="Vehicle"
      filters={{ ...filters, type: "vehicle" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).vehicles}
      items={vehicles}
      CardComponent={VehicleCard}
      loadingItem={loadingVehicles}
    />
  );
};

export default Vehicle;
