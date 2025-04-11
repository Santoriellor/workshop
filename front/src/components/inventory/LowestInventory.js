// Contexts
import { useInventoryContext } from '../../contexts/InventoryContext'
// Components
import InventoryCard from './InventoryCard'

const LowestInventory = () => {
  const { inventory, loadingInventory } = useInventoryContext()

  return (
    <>
      <h3>Lowest Inventory parts</h3>
      {/* latest reports list with card display */}
      <div className="list">
        {loadingInventory ? (
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
