import { useMemo } from "react";

// Components
import FilterBar from "./FilterBar";
import ScrollToTopButton from "./buttons/ScrollToTopButton";
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
  items,
  CardComponent,
  loadingItem,
}) => {
  const { openViewModal, openEditModal, openDeleteModal } = useGlobalContext();
  const { vehicles, getVehicleInfoByVehicleId } = useVehicleContext();

  const handleFilterChange = (name, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Filter items based on filters
  const filteredItems = useMemo(() => {
    // Filter the items
    let itemsAfterFilter = items.filter((item) =>
      filterItems(item, filters, vehicles, getVehicleInfoByVehicleId)
    );

    // If the filter label is "quantity_in_stock", sort the filtered items
    if (filters.quantity_in_stock) {
      itemsAfterFilter = itemsAfterFilter.sort(
        (a, b) => a.quantity_in_stock - b.quantity_in_stock
      );
    }

    return itemsAfterFilter;
  }, [items, filters, vehicles, getVehicleInfoByVehicleId]);

  return (
    <>
      {/* Filter bar with filter options */}
      <FilterBar
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Items list with card display */}
      <div className="list">
        {loadingItem ? (
          <p>Loading {itemType.toLowerCase()}...</p>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <CardComponent
              key={item.id}
              item={item}
              handleViewClick={openViewModal}
              handleEditClick={openEditModal}
              handleDeleteClick={openDeleteModal}
            />
          ))
        ) : (
          <p>No {itemType} match your filters.</p>
        )}
      </div>

      {/* Floating ScrollToTopButton */}
      <ScrollToTopButton />
    </>
  );
};
export default Page;
