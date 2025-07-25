// Zustand
import useInventoryStore from '../../stores/useInventoryStore'
// Components
import InventoryCard from './InventoryCard'
import LoadingScreen from '../LoadingScreen'

const LowestInventory = () => {
  const { inventory, loading } = useInventoryStore()
  const lowStockInventory = [...inventory]
    .sort((a, b) => a.quantity_in_stock - b.quantity_in_stock)
    .slice(0, 5)

  return (
    <>
      <h3>Lowest Inventory parts</h3>
      {/* latest reports list with card display */}
      <div className="list">
        {loading ? (
          <LoadingScreen fullscreen={false} />
        ) : lowStockInventory.length > 0 ? (
          lowStockInventory.map((item) => <InventoryCard key={item.id} item={item} />)
        ) : (
          <p>No parts found.</p>
        )}
      </div>
    </>
  )
}
export default LowestInventory
