import { useState, useEffect } from 'react'
// Utils
import getFilterOptions from '../utils/filterBarFilterOptions'
// Components
import Page from '../components/Page'
import InventoryCard from '../components/inventory/InventoryCard'
import InventoryModal from '../components/inventory/InventoryModal'
// Contexts
import { useInventoryContext } from '../contexts/InventoryContext'
import { useGlobalContext } from '../contexts/GlobalContext'

const Inventory = () => {
  const { inventory, loadingInventory, deleteInventoryPartWithAlert } = useInventoryContext()
  const { setModalState } = useGlobalContext()

  const [filters, setFilters] = useState({
    part_name: '',
    reference_code: '',
    category: '',
    quantity_in_stock: '',
    unit_price: '',
    updated_at: '',
  })

  useEffect(() => {
    setModalState((prev) => ({
      ...prev,
      modalComponent: InventoryModal,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Page
      itemType="part"
      filters={{ ...filters, type: 'inventory' }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).inventory}
      items={inventory}
      deleteItemWithAlert={deleteInventoryPartWithAlert}
      CardComponent={InventoryCard}
      ModalComponent={InventoryModal}
      loadingItem={loadingInventory}
    />
  )
}

export default Inventory
