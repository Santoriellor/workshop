import { useState } from "react";

// Contexts
import { useGlobalContext } from "../../contexts/GlobalContext";
import { useVehicleContext } from "../../contexts/VehicleContext";
import { useOwnerContext } from "../../contexts/OwnerContext";
// Utils
import { Toast } from "../../utils/sweetalert";
// Styles
import "../../styles/Modal.css";
// Data
import brandModelMap from "../../data/brandModelMap.json";
const brands = Object.keys(brandModelMap);

const VehicleModal = () => {
  const itemType = "Vehicle";

  const { selectedItem, readonly, setReadonly, openDeleteModal, closeModals } =
    useGlobalContext();
  const {
    createVehicleWithAlert,
    updateVehicleWithAlert,
    deleteVehicleWithAlert,
  } = useVehicleContext();
  const { owners } = useOwnerContext();

  const [vehicleData, setVehicleData] = useState({
    brand: selectedItem?.brand || "",
    model: selectedItem?.model,
    year: selectedItem?.year || "",
    license_plate: selectedItem?.license_plate || "",
    owner: selectedItem?.owner || "",
  });

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;

    setVehicleData({
      ...vehicleData,
      [name]: name === "owner" ? Number(value) : value,
    });
  };

  const handleBrandChange = (e) => {
    const { value } = e.target;
    setVehicleData({
      ...vehicleData,
      brand: value,
      model: "", // Reset model when brand changes
    });
  };

  const toggleReadonly = (e) => {
    e.preventDefault();
    setReadonly(!readonly);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleData.brand) {
      Toast.fire("Error", "Please fill in a brand.", "error");
      return;
    }
    if (!vehicleData.model) {
      Toast.fire("Error", "Please select a model.", "error");
      return;
    }
    if (!vehicleData.year) {
      Toast.fire("Error", "Please select a year.", "error");
      return;
    }
    if (!vehicleData.license_plate) {
      Toast.fire("Error", "Please fill in a license plate.", "error");
      return;
    }
    if (!vehicleData.owner) {
      Toast.fire("Error", "Please fill in an owner.", "error");
      return;
    }

    try {
      const newVehicle = await createVehicleWithAlert(vehicleData);
      if (newVehicle) {
        setVehicleData({
          brand: "",
          model: "",
          year: "",
          license_plate: "",
          owner: "",
        });
      }
    } catch (error) {
      console.error("Error creating vehicle:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      closeModals();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleData.brand) {
      Toast.fire("Error", "Please fill in a brand.", "error");
      return;
    }
    if (!vehicleData.model) {
      Toast.fire("Error", "Please select a model.", "error");
      return;
    }
    if (!vehicleData.year) {
      Toast.fire("Error", "Please select a year.", "error");
      return;
    }
    if (!vehicleData.license_plate) {
      Toast.fire("Error", "Please fill in a license plate.", "error");
      return;
    }
    if (!vehicleData.owner) {
      Toast.fire("Error", "Please fill in an owner.", "error");
      return;
    }

    try {
      const updatedVehicle = await updateVehicleWithAlert(
        selectedItem.id,
        vehicleData
      );
    } catch (error) {
      console.error("Error updating vehicle:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      setVehicleData(null);
      closeModals();
    }
  };

  return (
    <div className="modal-container">
      <div className="modal-card">
        <svg
          onClick={closeModals}
          className="modal-card-close"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            width="100%"
            height="100%"
            d="M11.414 10l2.829-2.828a1 1 0 1 0-1.415-1.415L10 8.586 7.172 5.757a1 1 0 0 0-1.415 1.415L8.586 10l-2.829 2.828a1 1 0 0 0 1.415 1.415L10 11.414l2.828 2.829a1 1 0 0 0 1.415-1.415L11.414 10zM10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z"
          />
        </svg>
        {readonly ? (
          <h2>View Vehicle</h2>
        ) : selectedItem ? (
          <h2>Edit Vehicle</h2>
        ) : (
          <h2>Create Vehicle</h2>
        )}
        <form
          className="modal-form"
          onSubmit={selectedItem ? handleEditSubmit : handleCreateSubmit}
        >
          <fieldset>
            <label>
              Brand:
              <select
                name="brand"
                value={vehicleData.brand}
                onChange={handleBrandChange}
                required
                disabled={readonly}
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Model:
              <select
                name="model"
                value={vehicleData.model}
                onChange={handleVehicleChange}
                disabled={!vehicleData.brand || readonly}
                required
              >
                <option value="">Select a model</option>
                {vehicleData.brand &&
                  brandModelMap[vehicleData.brand]?.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Year:
              <input
                type="number"
                name="year"
                placeholder="Enter vehicle year"
                value={vehicleData.year}
                onChange={handleVehicleChange}
                min="1900"
                max={new Date().getFullYear()}
                required
                disabled={readonly}
              />
            </label>
            <label>
              License plate:
              <input
                type="text"
                name="license_plate"
                placeholder="Enter vehicle license plate"
                value={vehicleData.license_plate}
                onChange={handleVehicleChange}
                required
                disabled={readonly}
              />
            </label>
            <label>
              Owner:
              <select
                name="owner"
                value={vehicleData.owner}
                onChange={handleVehicleChange}
                required
                disabled={readonly}
              >
                <option value="">Select an owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.full_name}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          <div className="button-group">
            {selectedItem ? (
              <>
                {readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Vehicle
                  </button>
                ) : (
                  <button type="submit" disabled={readonly}>
                    Update Vehicle
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      selectedItem,
                      itemType,
                      () => deleteVehicleWithAlert
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={readonly}>
                Create Vehicle
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default VehicleModal;
