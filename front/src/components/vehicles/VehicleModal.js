import { useState, useEffect, useMemo } from "react";

// Contexts
import { useGlobalContext } from "../../contexts/GlobalContext";
import { useVehicleContext } from "../../contexts/VehicleContext";
import { useOwnerContext } from "../../contexts/OwnerContext";
// Utils
import { Toast } from "../../utils/sweetalert";
import {
  isValidOrTakenLicensePlate,
  isValidYear,
} from "../../utils/validation";
// Styles
import "../../styles/Modal.css";
// Data
import brandModelMap from "../../data/brandModelMap.json";
const brands = Object.keys(brandModelMap);

const VehicleModal = () => {
  const itemType = "Vehicle";
  // Error messages
  const [errors, setErrors] = useState({
    brand: "",
    model: "",
    license_plate: "This field is required.",
    owner: "This field is required.",
  });

  const { selectedItem, readonly, setReadonly, openDeleteModal, closeModals } =
    useGlobalContext();
  const {
    vehicles,
    createVehicleWithAlert,
    updateVehicleWithAlert,
    deleteVehicleWithAlert,
    loadingVehicles,
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

    setVehicleData((prevData) => ({
      ...prevData,
      [name]:
        name === "owner"
          ? Number(value)
          : name === "license_plate"
          ? value.toUpperCase()
          : value,
    }));
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
      await updateVehicleWithAlert(selectedItem.id, vehicleData);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      setVehicleData(null);
      closeModals();
    }
  };

  // Live validation
  const existingLicensePlates = vehicles
    .map((vehicle) => vehicle.license_plate)
    .filter(
      (plate) =>
        !selectedItem ||
        plate.toLowerCase() !== selectedItem.license_plate.toLowerCase()
    );

  useEffect(() => {
    const licensePlateError = isValidOrTakenLicensePlate(
      vehicleData.license_plate,
      existingLicensePlates
    );
    setErrors((prevErrors) =>
      prevErrors.license_plate !== licensePlateError
        ? { ...prevErrors, license_plate: licensePlateError }
        : prevErrors
    );
  }, [vehicleData.license_plate]);

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      brand: vehicleData.brand ? "" : "This field is required.",
    }));
  }, [vehicleData.brand]);

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      model: vehicleData.model ? "" : "This field is required.",
    }));
  }, [vehicleData.model]);

  useEffect(() => {
    const yearError =
      vehicleData.year === ""
        ? "This field is required."
        : isValidYear(vehicleData.year);
    setErrors((prevErrors) =>
      prevErrors.year !== yearError
        ? { ...prevErrors, year: yearError }
        : prevErrors
    );
  }, [vehicleData.year]);

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      owner: vehicleData.owner ? "" : "This field is required.",
    }));
  }, [vehicleData.owner]);

  const isFormValid = useMemo(
    () =>
      !errors.brand &&
      !errors.model &&
      !errors.year &&
      !errors.license_plate &&
      !errors.owner &&
      vehicleData.brand &&
      vehicleData.model &&
      vehicleData.year &&
      vehicleData.license_plate &&
      vehicleData.owner,
    [errors, vehicleData]
  );

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
              <span>Brand:</span>
              <select
                className={errors.brand ? "invalid" : "valid"}
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
              <p className="error-text">
                {errors.brand && <>{errors.brand}</>}
              </p>
            </label>
            <label>
              <span>Model:</span>
              <select
                className={errors.model ? "invalid" : "valid"}
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
              <p className="error-text">
                {errors.model && <>{errors.model}</>}
              </p>
            </label>
            <label>
              <span>Year:</span>
              <input
                className={errors.year ? "invalid" : "valid"}
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
              <p className="error-text">{errors.year && <>{errors.year}</>}</p>
            </label>
            <label>
              <span>License plate:</span>
              <input
                className={errors.license_plate ? "invalid" : "valid"}
                type="text"
                name="license_plate"
                placeholder="Enter vehicle license plate"
                value={vehicleData.license_plate}
                onChange={handleVehicleChange}
                required
                disabled={readonly}
              />
              <p className="error-text">
                {errors.license_plate && <>{errors.license_plate}</>}
              </p>
            </label>
            <label>
              <span>Owner:</span>
              <select
                className={errors.owner ? "invalid" : "valid"}
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
              <p className="error-text">
                {errors.owner && <>{errors.owner}</>}
              </p>
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
                  <button
                    type="submit"
                    disabled={readonly || !isFormValid || loadingVehicles}
                  >
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
              <button
                type="submit"
                disabled={readonly || !isFormValid || loadingVehicles}
              >
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
