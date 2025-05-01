import { filterItems } from './pageItemFilter'
import { getVehicleInfoByVehicleId } from './getVehicleInfoByVehicleId'

const getFilteredItems = (items, filters, vehicles) => {
  if (!Array.isArray(items)) return []

  let filtered = items.filter((item) =>
    filterItems(item, filters, vehicles, getVehicleInfoByVehicleId),
  )

  if (filters.quantity_in_stock) {
    filtered = filtered.sort((a, b) => a.quantity_in_stock - b.quantity_in_stock)
  }

  return filtered
}

export default getFilteredItems
