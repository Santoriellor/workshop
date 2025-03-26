import { useState, useEffect, useMemo } from "react";

// Contexts
import { useGlobalContext } from "../../contexts/GlobalContext";
import { useInventoryContext } from "../../contexts/InventoryContext";
// Utils
import { Toast } from "../../utils/sweetalert";
import {
  isValidReferenceCode,
  isValidQuantityInStock,
  isValidPrice,
} from "../../utils/validation";
// Styles
import "../../styles/Modal.css";

/* Could be put into a JSON file */
// CATEGORIES
const categories = [
  "Brakes",
  "Engine",
  "Exhaust",
  "Suspension",
  "Transmission",
  "Wheels",
  "Steering",
  "Fluids",
  "Electrical",
  "Cooling",
];

const InventoryModal = () => {
  const itemType = "Inventory part";
  // Error messages
  const [errors, setErrors] = useState({
    name: "",
    reference_code: "",
    category: "",
    quantity_in_stock: "",
    unit_price: "",
  });

  const { selectedItem, readonly, setReadonly, openDeleteModal, closeModals } =
    useGlobalContext();
  const {
    inventory,
    createInventoryPartWithAlert,
    updateInventoryPartWithAlert,
    deleteInventoryPartWithAlert,
    loadingInventory,
  } = useInventoryContext();

  const [inventoryData, setInventoryData] = useState({
    name: selectedItem?.name || "",
    reference_code: selectedItem?.reference_code || "",
    category: selectedItem?.category || "",
    quantity_in_stock: selectedItem?.quantity_in_stock || "",
    unit_price: selectedItem?.unit_price || "",
  });

  const handleInventoryChange = (e) => {
    const { name, value } = e.target;

    setInventoryData({
      ...inventoryData,
      [name]: value,
    });
  };

  const toggleReadonly = (e) => {
    e.preventDefault();
    setReadonly(!readonly);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!inventoryData.name) {
      Toast.fire("Error", "Please fill in a part name.", "error");
      return;
    }
    if (!inventoryData.reference_code) {
      Toast.fire("Error", "Please fill in a reference code.", "error");
      return;
    }
    if (!inventoryData.category) {
      Toast.fire("Error", "Please select a category.", "error");
      return;
    }
    if (!inventoryData.quantity_in_stock) {
      Toast.fire("Error", "Please fill in a quantity.", "error");
      return;
    }
    if (!inventoryData.unit_price) {
      Toast.fire("Error", "Please fill in a unit price.", "error");
      return;
    }

    try {
      const newInventory = await createInventoryPartWithAlert(inventoryData);
      if (newInventory) {
        setInventoryData({
          name: "",
          reference_code: "",
          category: "",
          quantity_in_stock: "",
          unit_price: "",
        });
      }
    } catch (error) {
      console.error("Error creating inventory part:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      closeModals();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!inventoryData.name) {
      Toast.fire("Error", "Please fill in a part name.", "error");
      return;
    }
    if (!inventoryData.reference_code) {
      Toast.fire("Error", "Please fill in a reference code.", "error");
      return;
    }
    if (!inventoryData.category) {
      Toast.fire("Error", "Please select a category.", "error");
      return;
    }
    if (!inventoryData.quantity_in_stock) {
      Toast.fire("Error", "Please fill in a quantity.", "error");
      return;
    }
    if (!inventoryData.unit_price) {
      Toast.fire("Error", "Please fill in a unit price.", "error");
      return;
    }

    try {
      await updateInventoryPartWithAlert(selectedItem.id, inventoryData);
    } catch (error) {
      console.error("Error updating inventory part:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      setInventoryData(null);
      closeModals();
    }
  };

  // Live validation
  const existingReferenceCodes = inventory
    .map((part) => part.reference_code)
    .filter(
      (reference) =>
        !selectedItem ||
        reference.toLowerCase() !== selectedItem.reference_code.toLowerCase()
    );

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      name: inventoryData.name ? "" : "This field is required.",
    }));
  }, [inventoryData.name]);

  useEffect(() => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      category: inventoryData.category ? "" : "This field is required.",
    }));
  }, [inventoryData.category]);

  useEffect(() => {
    const referenceCodeError =
      inventoryData.reference_code.trim() === ""
        ? "This field is required."
        : isValidReferenceCode(
            inventoryData.reference_code,
            existingReferenceCodes
          );
    setErrors((prevErrors) =>
      prevErrors.reference_code !== referenceCodeError
        ? { ...prevErrors, reference_code: referenceCodeError }
        : prevErrors
    );
  }, [inventoryData.reference_code]);

  useEffect(() => {
    const quantityError =
      inventoryData.quantity_in_stock.toString().trim() === ""
        ? "This field is required."
        : isValidQuantityInStock(inventoryData.quantity_in_stock.toString());
    setErrors((prevErrors) =>
      prevErrors.quantity_in_stock !== quantityError
        ? { ...prevErrors, quantity_in_stock: quantityError }
        : prevErrors
    );
  }, [inventoryData.quantity_in_stock]);

  useEffect(() => {
    const priceError =
      inventoryData.unit_price.toString().trim() === ""
        ? "This field is required."
        : isValidPrice(inventoryData.unit_price.toString());
    setErrors((prevErrors) =>
      prevErrors.unit_price !== priceError
        ? { ...prevErrors, unit_price: priceError }
        : prevErrors
    );
  }, [inventoryData.unit_price]);

  const isFormValid = useMemo(
    () =>
      !errors.name &&
      !errors.reference_code &&
      !errors.category &&
      !errors.quantity_in_stock &&
      !errors.unit_price &&
      inventoryData.name &&
      inventoryData.reference_code &&
      inventoryData.category &&
      inventoryData.quantity_in_stock &&
      inventoryData.unit_price,
    [errors, inventoryData]
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
          <h2>View Part</h2>
        ) : selectedItem ? (
          <h2>Edit Part</h2>
        ) : (
          <h2>Create Part</h2>
        )}
        <form
          className="modal-form"
          onSubmit={selectedItem ? handleEditSubmit : handleCreateSubmit}
        >
          <fieldset>
            <label>
              <span>Name:</span>
              <input
                className={errors.name ? "invalid" : "valid"}
                type="text"
                name="name"
                value={inventoryData.name}
                onChange={handleInventoryChange}
                placeholder="Enter name"
                required
                disabled={readonly}
              />
              <p className="error-text">{errors.name && <>{errors.name}</>}</p>
            </label>

            <label>
              <span>Reference code:</span>
              <input
                className={errors.reference_code ? "invalid" : "valid"}
                type="text"
                name="reference_code"
                value={inventoryData.reference_code}
                onChange={handleInventoryChange}
                placeholder="Enter reference code"
                required
                disabled={readonly}
              />
              <p className="error-text">
                {errors.reference_code && <>{errors.reference_code}</>}
              </p>
            </label>

            <label>
              <span>Category:</span>
              <select
                className={errors.category ? "invalid" : "valid"}
                name="category"
                value={inventoryData.category}
                onChange={handleInventoryChange}
                required
                disabled={readonly}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="error-text">
                {errors.category && <>{errors.category}</>}
              </p>
            </label>

            <label>
              <span>Quantity in stock:</span>
              <input
                className={errors.quantity_in_stock ? "invalid" : "valid"}
                type="text"
                name="quantity_in_stock"
                value={inventoryData.quantity_in_stock}
                onChange={handleInventoryChange}
                placeholder="Enter quantity in stock"
                disabled={readonly}
              />
              <p className="error-text">
                {errors.quantity_in_stock && <>{errors.quantity_in_stock}</>}
              </p>
            </label>
            <label>
              <span>Unit price:</span>
              <input
                className={errors.unit_price ? "invalid" : "valid"}
                type="text"
                name="unit_price"
                value={inventoryData.unit_price}
                onChange={handleInventoryChange}
                placeholder="Enter unit price"
                disabled={readonly}
              />
              <p className="error-text">
                {errors.unit_price && <>{errors.unit_price}</>}
              </p>
            </label>
          </fieldset>
          <div className="button-group">
            {selectedItem ? (
              <>
                {readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Part
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={readonly || !isFormValid || loadingInventory}
                  >
                    Update Part
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      selectedItem,
                      itemType,
                      () => deleteInventoryPartWithAlert
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={readonly || !isFormValid || loadingInventory}
              >
                Create Part
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default InventoryModal;
