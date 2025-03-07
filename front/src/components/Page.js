import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Components
import FilterBar from "./FilterBar";
import DeleteModal from "./DeleteModal";
import ScrollToTopButton from "./ScrollToTopButton";
// Contexts
import { useGlobalContext } from "../contexts/GlobalContext";
import { useVehicleContext } from "../contexts/VehicleContext";
// Styles
import "../styles/Cards.css";
// Utils
import { filterItems } from "../utils/pageItemFilter";

const Page = ({
  itemType,
  filters,
  setFilters,
  filterOptions,
  sortingCardFunction,
  items,
  deleteItemWithAlert,
  CardComponent,
  ModalComponent,
}) => {
  const location = useLocation();
  const { selectedItem, setSelectedItem } = useGlobalContext();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { vehicles, getVehicleInfoByVehicleId } = useVehicleContext();

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  // Filter items based on filters
  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      filterItems(item, filters, vehicles, getVehicleInfoByVehicleId)
    );
  }, [items, filters, vehicles, getVehicleInfoByVehicleId]);

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setReadonly(true);
    setShowDeleteModal(false);
    setShowTypeModal(true);
  };

  const handleCreateClick = () => {
    setSelectedItem(null);
    setReadonly(false);
    setShowDeleteModal(false);
    setShowTypeModal(true);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setReadonly(false);
    setShowDeleteModal(false);
    setShowTypeModal(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setShowTypeModal(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteItemWithAlert(selectedItem.id);
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  // Display the corresponding Modal if viewItemId is passed in location state
  useEffect(() => {
    if (location.state?.viewItemId) {
      const item = items.find((item) => item.id === location.state.viewItemId);
      if (item) handleViewClick(item);
    }
  }, [location.state]);

  return (
    <>
      {/* Filter bar with filter options */}
      <FilterBar
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Items list with card display */}
      <div className="list">
        {filteredItems.length > 0 ? (
          filteredItems
            .sort(sortingCardFunction)
            .map((item) => (
              <CardComponent
                key={item.id}
                item={item}
                handleViewClick={handleViewClick}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
              />
            ))
        ) : (
          <p>No {itemType} match your filters.</p>
        )}
      </div>

      {/* Floating create Button */}
      <button className="btn btn-float" onClick={handleCreateClick}>
        New {itemType}
      </button>

      {/* Floating ScrollToTopButton */}
      <ScrollToTopButton />

      {showTypeModal && (
        <ModalComponent
          readonly={readonly}
          setReadonly={setReadonly}
          onClose={() => setShowTypeModal(false)}
          onDelete={() => handleDeleteClick(selectedItem)}
        />
      )}
      {showDeleteModal && (
        <DeleteModal
          itemType={itemType}
          onClose={() => setShowDeleteModal(false)}
          handleDeleteConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
};
export default Page;
