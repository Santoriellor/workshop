// Zustand
import useInventoryStore from '../../stores/useInventoryStore'
// Components
import InventoryCard from './InventoryCard'

const LowestInventory = () => {
  const { inventory, loading } = useInventoryStore()

  return (
    <>
      <h3>Lowest Inventory parts</h3>
      {/* latest reports list with card display */}
      <div className="list">
        {loading ? (
          <p>Loading inventory...</p>
        ) : inventory.length > 0 ? (
          inventory.map((item) => <InventoryCard key={item.id} item={item} />)
        ) : (
          <p>No parts found.</p>
        )}
      </div>
    </>
  )
}
export default LowestInventory
