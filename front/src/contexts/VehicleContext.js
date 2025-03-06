import React, { createContext, useContext, useState, useEffect } from "react";
// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import { Toast } from "../utils/sweetalert";

const VehicleContext = createContext();

export const VehicleProvider = ({ children }) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const {
    data: vehicles,
    fetchData: fetchVehicles,
    createItem: createVehicle,
    updateItem: updateVehicle,
    deleteItem: deleteVehicle,
    loading,
    error,
  } = useCRUD("vehicles");

  // Create a vehicle with success alert
  const createVehicleWithAlert = async (vehicleData) => {
    const newVehicle = await createVehicle(vehicleData);
    if (newVehicle) {
      Toast.fire({
        icon: "success",
        title: "Vehicle created successfully!",
      });
    }
    return newVehicle;
  };

  // Update a vehicle with success alert
  const updateVehicleWithAlert = async (vehicleId, updatedFields) => {
    const updatedVehicle = await updateVehicle(vehicleId, updatedFields);
    if (updatedVehicle) {
      Toast.fire({
        icon: "success",
        title: "Vehicle updated successfully!",
      });
    }
    return updatedVehicle;
  };

  // Delete a vehicle with success alert
  const deleteVehicleWithAlert = async (vehicleId) => {
    const success = await deleteVehicle(vehicleId);
    if (success) {
      Toast.fire({
        icon: "success",
        title: "Vehicle deleted successfully!",
      });
    }
    return success;
  };

  // Function to get the vehicle description by vehicle ID
  const getVehicleInfoByVehicleId = (vehicleId) => {
    const vehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
    return vehicle ? vehicle.__str__ : "Unknown";
  };

  // Automatically fetch data on first load
  useEffect(() => {
    fetchVehicles();
  }, []);

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
        loading,
        error,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

// Custom hook for accessing the VehicleContext
export const useVehicleContext = () => useContext(VehicleContext);
