import { useState } from 'react'
// Utils
import getFilterOptions from '../utils/filterBarFilterOptions'
// Components
import Page from '../components/Page'
import InventoryCard from '../components/inventory/InventoryCard'
// Zustand
import useInventoryStore from '../stores/useInventoryStore'

const Inventory = () => {
  const { inventory, loading } = useInventoryStore()
  const [filters, setFilters] = useState({
    part_name: '',
    reference_code: '',
    category: '',
    quantity_in_stock: '',
    unit_price: '',
    updated_at: '',
  })

  return (
    <Page
      itemType="part"
      filters={{ ...filters, type: 'inventory' }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).inventory}
      items={inventory}
      CardComponent={InventoryCard}
      loadingItem={loading}
    />
  )
}

export default Inventory
