import React, { createContext, useEffect, useContext } from "react";

// Contexts
import { useVehicleContext } from "./VehicleContext";
// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import withSuccessAlert from "../utils/successAlert";

const OwnerContext = createContext();

export const OwnerProvider = ({ children }) => {
  const {
    data: owners,
    fetchData: fetchOwners,
    createItem: createOwner,
    updateItem: updateOwner,
    deleteItem: deleteOwner,
    loading: loadingOwners,
    error: errorOwners,
  } = useCRUD("owners");

  // Create a owner with success alert
  const createOwnerWithAlert = withSuccessAlert(
    createOwner,
    "Owner created successfully!"
  );
  // Update a owner with success alert
  const updateOwnerWithAlert = withSuccessAlert(
    updateOwner,
    "Owner updated successfully!"
  );
  // Delete a owner with success alert
  const deleteOwnerWithAlert = withSuccessAlert(
    deleteOwner,
    "Owner deleted successfully!"
  );

  const { vehicles } = useVehicleContext() || {};

  const getOwnerNameByVehicleId = (vehicleId) => {
    const vehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
    if (!vehicle) return "Unknown";

    const owner = owners.find((o) => o.id === vehicle.owner);
    return owner ? owner.full_name : "Unknown";
  };

  // Automatically fetch data on first load
  useEffect(() => {
    fetchOwners();
  }, []);

  return (
    <OwnerContext.Provider
      value={{
        owners,
        createOwnerWithAlert,
        updateOwnerWithAlert,
        deleteOwnerWithAlert,
        getOwnerNameByVehicleId,
        loadingOwners,
        errorOwners,
      }}
    >
      {children}
    </OwnerContext.Provider>
  );
};

// Custom hook for accessing the OwnerContext
export const useOwnerContext = () => useContext(OwnerContext);
