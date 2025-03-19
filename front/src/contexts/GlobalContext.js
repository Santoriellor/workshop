import { createContext, useContext, useState, useEffect } from "react";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [selectedItem, setSelectedItem] = useState({});
  const [itemType, setItemType] = useState({});
  const [modalComponent, setModalComponent] = useState();
  const [isModalReady, setIsModalReady] = useState(false);
  const [deleteItemWithAlert, setDeleteItemWithAlert] = useState(
    () => () => {}
  );
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [readonly, setReadonly] = useState(false);

  useEffect(() => {
    if (modalComponent && selectedItem !== null) {
      setIsModalReady(true);
    }
  }, [modalComponent, selectedItem]);

  // Function to open a modal with a specific component
  const openModal = (
    Component,
    item = null,
    type = null,
    isReadonly = false
  ) => {
    setModalComponent(() => Component);
    setSelectedItem(item);
    setItemType(type);
    setReadonly(isReadonly);
    setShowTypeModal(true);
    if (item === null) {
      setIsModalReady(true);
    } else {
      setIsModalReady(false);
    }
  };

  // Function to open a modal to confirm deletion
  const openDeleteModal = (item = null, type = null, deleteFunction) => {
    setSelectedItem(item);
    setItemType(type);
    setDeleteItemWithAlert(deleteFunction);
    setShowTypeModal(false);
    setShowDeleteModal(true);
  };

  // Function to delete an item after confirmation and close the delete modal
  const handleDeleteConfirm = () => {
    if (typeof deleteItemWithAlert === "function") {
      deleteItemWithAlert(selectedItem.id);
    } else {
      console.error(
        "deleteItemWithAlert is not a function",
        deleteItemWithAlert
      );
    }
    setShowDeleteModal(false);
    setSelectedItem(null);
    setItemType(null);
  };

  // Function to close modals
  const closeModals = () => {
    setShowTypeModal(false);
    setShowDeleteModal(false);
    setSelectedItem(null);
    setIsModalReady(false);
    /* setItemType(null); */
  };

  return (
    <GlobalContext.Provider
      value={{
        selectedItem,
        setSelectedItem,
        modalComponent,
        setModalComponent,
        showTypeModal,
        isModalReady,
        showDeleteModal,
        readonly,
        setReadonly,
        openModal,
        openDeleteModal,
        handleDeleteConfirm,
        closeModals,
        deleteItemWithAlert,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook to use the GlobalContext
export const useGlobalContext = () => useContext(GlobalContext);
