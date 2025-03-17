import { useState } from "react";

// Contexts
import { useGlobalContext } from "../../contexts/GlobalContext";
import { useOwnerContext } from "../../contexts/OwnerContext";
// Utils
import { Toast } from "../../utils/sweetalert";
// Styles
import "../../styles/Modal.css";

const OwnerModal = () => {
  const itemType = "Owner";

  const { selectedItem, readonly, setReadonly, openDeleteModal, closeModals } =
    useGlobalContext();
  const { createOwnerWithAlert, updateOwnerWithAlert, deleteOwnerWithAlert } =
    useOwnerContext();

  const [ownerData, setOwnerData] = useState({
    full_name: selectedItem?.full_name || "",
    email: selectedItem?.email || "",
    phone: selectedItem?.phone || "",
    address: selectedItem?.address || "",
  });

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;

    setOwnerData({
      ...ownerData,
      [name]: value,
    });
  };

  const toggleReadonly = (e) => {
    e.preventDefault();
    setReadonly(!readonly);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!ownerData.full_name) {
      Toast.fire("Error", "Please fill in a full name.", "error");
      return;
    }
    if (!ownerData.email) {
      Toast.fire("Error", "Please select a email.", "error");
      return;
    }
    if (!ownerData.address) {
      Toast.fire("Error", "Please select an address.", "error");
      return;
    }
    if (!ownerData.phone) {
      Toast.fire("Error", "Please fill in a phone number.", "error");
      return;
    }

    try {
      const newOwner = await createOwnerWithAlert(ownerData);
      if (newOwner) {
        setOwnerData({
          full_name: "",
          email: "",
          phone: "",
          address: "",
        });
      }
    } catch (error) {
      console.error("Error creating owner:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      closeModals();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!ownerData.full_name) {
      Toast.fire("Error", "Please fill in a full name.", "error");
      return;
    }
    if (!ownerData.email) {
      Toast.fire("Error", "Please select a email.", "error");
      return;
    }
    if (!ownerData.address) {
      Toast.fire("Error", "Please select an address.", "error");
      return;
    }
    if (!ownerData.phone) {
      Toast.fire("Error", "Please fill in a phone number.", "error");
      return;
    }

    try {
      const updatedOwner = await updateOwnerWithAlert(
        selectedItem.id,
        ownerData
      );
    } catch (error) {
      console.error("Error updating owner:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      setOwnerData(null);
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
          <h2>View Owner</h2>
        ) : selectedItem ? (
          <h2>Edit Owner</h2>
        ) : (
          <h2>Create Owner</h2>
        )}
        <form
          className="modal-form"
          onSubmit={selectedItem ? handleEditSubmit : handleCreateSubmit}
        >
          <fieldset>
            <label>
              Full Name:
              <input
                type="text"
                name="full_name"
                value={ownerData.full_name}
                onChange={handleOwnerChange}
                placeholder="Enter full name"
                required
                disabled={readonly}
              />
            </label>

            <label>
              Email:
              <input
                type="email"
                name="email"
                value={ownerData.email}
                onChange={handleOwnerChange}
                placeholder="Enter email"
                required
                disabled={readonly}
              />
            </label>

            <label>
              Address:
              <input
                type="text"
                name="address"
                value={ownerData.address}
                onChange={handleOwnerChange}
                placeholder="Enter address"
                required
                disabled={readonly}
              />
            </label>

            <label>
              Phone:
              <input
                type="text"
                name="phone"
                value={ownerData.phone}
                onChange={handleOwnerChange}
                placeholder="Enter phone"
                required
                disabled={readonly}
              />
            </label>
          </fieldset>
          <div className="button-group">
            {selectedItem ? (
              <>
                {readonly ? (
                  <button type="button" onClick={toggleReadonly}>
                    Edit Owner
                  </button>
                ) : (
                  <button type="submit" disabled={readonly}>
                    Update Owner
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal(
                      selectedItem,
                      itemType,
                      () => deleteOwnerWithAlert
                    )
                  }
                >
                  Delete
                </button>
              </>
            ) : (
              <button type="submit" disabled={readonly}>
                Create Owner
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default OwnerModal;
