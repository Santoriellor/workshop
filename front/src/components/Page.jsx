import { useMemo } from 'react'

// Components
import FilterBar from './FilterBar'
import ScrollToTopButton from './buttons/ScrollToTopButton'
import LoadingScreen from './LoadingScreen'
// Zustand
import useVehicleStore from '../stores/useVehicleStore'
// Contexts
import { useGlobalContext } from '../contexts/GlobalContext'
// Styles
import '../styles/Cards.css'
// Utils
import getFilteredItems from '../utils/getFilteredItems'

const Page = ({
  itemType,
  filters,
  setFilters,
  filterOptions,
  items,
  CardComponent,
  loadingItem,
}) => {
  const { openViewModal, openEditModal, openDeleteModal } = useGlobalContext()
  const { vehicles } = useVehicleStore()

  const handleFilterChange = (name, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }))
  }

  // Filter items based on filters
  const filteredItems = useMemo(
    () => getFilteredItems(items, filters, vehicles),
    [items, filters, vehicles],
  )

  // Display the items in a card format when the items are loaded
  let content
  if (loadingItem) {
    content = <LoadingScreen fullscreen={false} />
  } else if (filteredItems.length > 0) {
    content = filteredItems.map((item) => (
      <CardComponent
        key={item.id}
        item={item}
        handleViewClick={openViewModal}
        handleEditClick={openEditModal}
        handleDeleteClick={openDeleteModal}
      />
    ))
  } else {
    content = <p>No {itemType} match your filters.</p>
  }

  return (
    <>
      {/* Filter bar with filter options */}
      <FilterBar filterOptions={filterOptions} onFilterChange={handleFilterChange} />

      {/* Items list with card display */}
      <div className="list">{content}</div>

      {/* Floating ScrollToTopButton */}
      <ScrollToTopButton />
    </>
  )
}
export default Page
