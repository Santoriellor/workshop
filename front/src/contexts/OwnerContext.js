import React, { createContext, useEffect, useContext } from "react";

// Contexts
import { useVehicleContext } from "./VehicleContext";
// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import { Toast } from "../utils/sweetalert";

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
  const createOwnerWithAlert = async (ownerData) => {
    const newOwner = await createOwner(ownerData);
    if (newOwner) {
      Toast.fire({
        icon: "success",
        title: "Owner created successfully!",
      });
    }
    return newOwner;
  };

  // Update a owner with success alert
  const updateOwnerWithAlert = async (ownerId, updatedFields) => {
    const updatedOwner = await updateOwner(ownerId, updatedFields);
    if (updatedOwner) {
      Toast.fire({
        icon: "success",
        title: "Owner updated successfully!",
      });
    }
    return updatedOwner;
  };

  // Delete a owner with success alert
  const deleteOwnerWithAlert = async (ownerId) => {
    const success = await deleteOwner(ownerId);
    if (success) {
      Toast.fire({
        icon: "success",
        title: "Owner deleted successfully!",
      });
    }
    return success;
  };

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
