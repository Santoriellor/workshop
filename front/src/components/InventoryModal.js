import { useState } from "react";

// Contexts
import { useGlobalContext } from "../contexts/GlobalContext";
import { useInventoryContext } from "../contexts/InventoryContext";
// Utils
import { Toast } from "../utils/sweetalert";
// Styles
import "../styles/Modal.css";

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

const InventoryModal = ({ readonly, setReadonly, onClose, onDelete }) => {
  const { selectedItem } = useGlobalContext();
  const { createInventoryPartWithAlert, updateInventoryPartWithAlert } =
    useInventoryContext();

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
      onClose();
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
      const updatedInventory = await updateInventoryPartWithAlert(
        selectedItem.id,
        inventoryData
      );
    } catch (error) {
      console.error("Error updating inventory part:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      setInventoryData(null);
      onClose();
    }
  };

  return (
    <div className="modal-container">
      <div className="modal-card">
        <svg
          onClick={onClose}
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
              Name:
              <input
                type="text"
                name="name"
                value={inventoryData.name}
                onChange={handleInventoryChange}
                placeholder="Enter name"
                required
                disabled={readonly}
              />
            </label>

            <label>
              Reference code:
              <input
                type="text"
                name="reference_code"
                value={inventoryData.reference_code}
                onChange={handleInventoryChange}
                placeholder="Enter reference code"
                required
                disabled={readonly}
              />
            </label>

            <label>
              Category:
              <select
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
            </label>

            <label>
              Quantity in stock:
              <input
                type="text"
                name="quantity_in_stock"
                value={inventoryData.quantity_in_stock}
                onChange={handleInventoryChange}
                placeholder="Enter quantity in stock"
                disabled={readonly}
              />
            </label>
            <label>
              Unit price:
              <input
                type="text"
                name="unit_price"
                value={inventoryData.unit_price}
                onChange={handleInventoryChange}
                placeholder="Enter unit price"
                disabled={readonly}
              />
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
                  <button type="submit" disabled={readonly}>
                    Update Part
                  </button>
                )}
                <button type="button" onClick={onDelete}>
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={readonly}>
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
