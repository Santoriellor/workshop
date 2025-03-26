import { useState, useEffect, useMemo } from "react";

// Contexts
import { useGlobalContext } from "../../contexts/GlobalContext";
import { useOwnerContext } from "../../contexts/OwnerContext";
// Utils
import { Toast } from "../../utils/sweetalert";
import {
  isValidEmail,
  isTakenOwnerName,
  isValidPhone,
  isValidAddress,
} from "../../utils/validation";
// Styles
import "../../styles/Modal.css";
import "../../styles/Auth.css";

const OwnerModal = () => {
  const itemType = "Owner";
  // Error messages
  const [errors, setErrors] = useState({
    full_name: "",
    email: "",
    address: "",
    phone: "",
  });

  const { selectedItem, readonly, setReadonly, openDeleteModal, closeModals } =
    useGlobalContext();
  const {
    owners,
    createOwnerWithAlert,
    updateOwnerWithAlert,
    deleteOwnerWithAlert,
    loadingOwners,
  } = useOwnerContext();

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
      await updateOwnerWithAlert(selectedItem.id, ownerData);
    } catch (error) {
      console.error("Error updating owner:", error);
      Toast.fire("Error", "Something went wrong.", "error");
    } finally {
      setOwnerData(null);
      closeModals();
    }
  };

  // Live validation
  const existingOwnerNames = owners
    .map((owner) => owner.full_name)
    .filter(
      (name) =>
        !selectedItem ||
        name.toLowerCase() !== selectedItem.full_name.toLowerCase()
    );

  useEffect(() => {
    const fullNameError =
      ownerData.full_name.trim() === ""
        ? "This field is required."
        : isTakenOwnerName(ownerData.full_name, existingOwnerNames);
    setErrors((prevErrors) =>
      prevErrors.full_name !== fullNameError
        ? { ...prevErrors, full_name: fullNameError }
        : prevErrors
    );
  }, [ownerData.full_name]);

  useEffect(() => {
    const emailError =
      ownerData.email.trim() === ""
        ? "This field is required."
        : isValidEmail(ownerData.email);
    setErrors((prevErrors) =>
      prevErrors.email !== emailError
        ? { ...prevErrors, email: emailError }
        : prevErrors
    );
  }, [ownerData.email]);

  useEffect(() => {
    const addressError =
      ownerData.address.trim() === ""
        ? "This field is required."
        : isValidAddress(ownerData.address);
    setErrors((prevErrors) =>
      prevErrors.address !== addressError
        ? { ...prevErrors, address: addressError }
        : prevErrors
    );
  }, [ownerData.address]);

  useEffect(() => {
    const phoneError =
      ownerData.phone.trim() === ""
        ? "This field is required."
        : isValidPhone(ownerData.phone);
    setErrors((prevErrors) =>
      prevErrors.phone !== phoneError
        ? { ...prevErrors, phone: phoneError }
        : prevErrors
    );
  }, [ownerData.phone]);

  const isFormValid = useMemo(
    () =>
      !errors.email &&
      !errors.full_name &&
      !errors.address &&
      !errors.phone &&
      ownerData.email &&
      ownerData.full_name &&
      ownerData.address &&
      ownerData.phone,
    [errors, ownerData]
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
              <span>Full Name:</span>
              <input
                className={errors.full_name ? "invalid" : "valid"}
                type="text"
                name="full_name"
                value={ownerData.full_name}
                onChange={handleOwnerChange}
                placeholder="Enter full name"
                required
                disabled={readonly}
              />
              <p className="error-text">
                {errors.full_name && <>{errors.full_name}</>}
              </p>
            </label>

            <label>
              <span>Email:</span>
              <input
                className={errors.email ? "invalid" : "valid"}
                type="email"
                name="email"
                value={ownerData.email}
                onChange={handleOwnerChange}
                placeholder="Enter email"
                required
                disabled={readonly}
              />
              <p className="error-text">
                {errors.email && <>{errors.email}</>}
              </p>
            </label>

            <label>
              <span>Address:</span>
              <input
                className={errors.address ? "invalid" : "valid"}
                type="text"
                name="address"
                value={ownerData.address}
                onChange={handleOwnerChange}
                placeholder="Enter address"
                required
                disabled={readonly}
              />
              <p className="error-text">
                {errors.address && <>{errors.address}</>}
              </p>
            </label>

            <label>
              <span>Phone:</span>
              <input
                className={errors.phone ? "invalid" : "valid"}
                type="text"
                name="phone"
                value={ownerData.phone}
                onChange={handleOwnerChange}
                placeholder="Enter phone"
                required
                disabled={readonly}
              />
              <p className="error-text">
                {errors.phone && <>{errors.phone}</>}
              </p>
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
                  <button
                    type="submit"
                    disabled={readonly || !isFormValid || loadingOwners}
                  >
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
              <button
                type="submit"
                disabled={readonly || !isFormValid || loadingOwners}
              >
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
