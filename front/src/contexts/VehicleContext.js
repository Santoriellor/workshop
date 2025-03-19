import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import withSuccessAlert from "../utils/successAlert";

const VehicleContext = createContext();

export const VehicleProvider = ({ children }) => {
  const location = useLocation();
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const {
    data: vehicles,
    fetchData: fetchVehicles,
    createItem: createVehicle,
    updateItem: updateVehicle,
    deleteItem: deleteVehicle,
    loading: loadingVehicles,
    error,
  } = useCRUD("vehicles");

  // Create a vehicle with success alert
  const createVehicleWithAlert = withSuccessAlert(
    createVehicle,
    "Vehicle created successfully!"
  );
  // Update a vehicle with success alert
  const updateVehicleWithAlert = withSuccessAlert(
    updateVehicle,
    "Vehicle updated successfully!"
  );
  // Delete a vehicle with success alert
  const deleteVehicleWithAlert = withSuccessAlert(
    deleteVehicle,
    "Vehicle deleted successfully!"
  );

  // Function to get the vehicle description by vehicle ID
  const getVehicleInfoByVehicleId = (vehicleId) => {
    const vehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
    return vehicle ? vehicle.__str__ : "Unknown";
  };

  // Automatically fetch data when pathname changes
  useEffect(() => {
    const vehiclePaths = ["/vehicle", "/report", "/dashboard", "/invoices"];
    if (vehiclePaths.includes(location.pathname)) {
      fetchVehicles({}, "brand, model");
    }
  }, [location.pathname]);

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        selectedVehicle,
        setSelectedVehicle,
        createVehicleWithAlert,
        updateVehicleWithAlert,
        deleteVehicleWithAlert,
        getVehicleInfoByVehicleId,
        loadingVehicles,
        error,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

// Custom hook for accessing the VehicleContext
export const useVehicleContext = () => useContext(VehicleContext);
