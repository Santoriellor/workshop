import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
// Zustand stores
import useInventoryStore from '../../stores/useInventoryStore'

const InventoryFetcher = () => {
  const location = useLocation()
  const { inventory, fetchInventory } = useInventoryStore()

  useEffect(() => {
    const paths = ['/inventory', '/tasktemplate', '/dashboard', '/report']
    if (paths.includes(location.pathname)) {
      let filters = {}
      let ordering = 'name'
      let limit = null
      let offset = null

      fetchInventory({ ...filters, ordering, limit, offset })
    }
  }, [location.pathname, inventory.length, fetchInventory])

  return null
}

export default InventoryFetcher
