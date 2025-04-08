import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const location = useLocation();

  const [modalState, setModalState] = useState({
    selectedItem: null,
    itemType: null,
    readonly: false,
    modalComponent: null,
    showModal: false,
    showDeleteModal: false,
    isModalReady: false,
  });

  const [deleteItemWithAlert, setDeleteItemWithAlert] = useState(
    () => () => {}
  );

  // Automatically set itemType based on pathname
  useEffect(() => {
    const pathToType = {
      "/report": "Report",
      "/dashboard": "Report",
      "/owner": "Owner",
      "/vehicle": "Vehicle",
      "/invoices": "Invoice",
      "/inventory": "Part",
      "/tasktemplate": "Task Template",
    };

    const matchedType = pathToType[location.pathname] || null;

    setModalState((prev) => ({
      ...prev,
      itemType: matchedType,
    }));
  }, [location.pathname]);

  useEffect(() => {
    if (modalState.modalComponent && modalState.selectedItem !== null) {
      setModalState((prev) => ({
        ...prev,
        isModalReady: true,
      }));
    }
  }, [modalState.modalComponent, modalState.selectedItem]);

  // Function to open a modal with a specific component
  const openModal = (
    Component,
    item = null,
    type = null,
    isReadonly = false
  ) => {
    setModalState((prev) => ({
      ...prev,
      selectedItem: item,
      itemType: type,
      readonly: isReadonly,
      modalComponent: Component,
      showModal: true,
      showDeleteModal: false,
      isModalReady: item === null,
    }));
  };

  // Function to open a modal to confirm deletion
  const openDeleteModal = (item = null, type, deleteFunction) => {
    setModalState((prev) => ({
      ...prev,
      selectedItem: item,
      itemType: type,
      showModal: false,
      showDeleteModal: true,
    }));
    setDeleteItemWithAlert(deleteFunction);
  };

  // Function to delete an item after confirmation and close the delete modal
  const handleDeleteConfirm = () => {
    if (typeof deleteItemWithAlert === "function") {
      deleteItemWithAlert(modalState.selectedItem.id);
    } else {
      console.error(
        "GlobalContext, The argument passed is not a function:",
        deleteItemWithAlert
      );
    }
    setModalState((prev) => ({
      ...prev,
      selectedItem: null,
      itemType: null,
      showDeleteModal: false,
    }));
  };

  // Function to close modals
  const closeModals = () => {
    setModalState((prev) => ({
      ...prev,
      selectedItem: null,
      isModalReady: false,
      showModal: false,
      showDeleteModal: false,
    }));
  };

  // Function to toggle the readonly state of the modal
  const toggleReadonly = (e) => {
    e.preventDefault();
    setModalState((prev) => ({
      ...prev,
      readonly: !modalState.readonly,
    }));
  };

  return (
    <GlobalContext.Provider
      value={{
        modalState,
        setModalState,
        openModal,
        openDeleteModal,
        handleDeleteConfirm,
        closeModals,
        toggleReadonly,
        deleteItemWithAlert,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook to use the GlobalContext
export const useGlobalContext = () => useContext(GlobalContext);
