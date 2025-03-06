import { useState } from "react";
// Utils
import getFilterOptions from "../utils/filterBarFilterOptions";
// Components
import Page from "../components/Page";
import VehicleCard from "../components/VehicleCard";
import VehicleModal from "../components/VehicleModal";
// Contexts
import { useVehicleContext } from "../contexts/VehicleContext";
// Styles
import "../styles/Vehicles.css";

const Vehicle = () => {
  const { vehicles, deleteVehicleWithAlert } = useVehicleContext();
  const [filters, setFilters] = useState({
    brand: "",
    model: "",
    year: "",
    license_plate: "",
    vehicle_owner: "",
  });

  return (
    <Page
      itemType="Vehicle"
      filters={{ ...filters, type: "vehicle" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).vehicles}
      sortingCardFunction={(a, b) => a.__str__.localeCompare(b.__str__)}
      items={vehicles}
      deleteItemWithAlert={deleteVehicleWithAlert}
      CardComponent={VehicleCard}
      ModalComponent={VehicleModal}
    />
  );
};

export default Vehicle;
