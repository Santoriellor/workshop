import { useEffect } from "react";
// Contexts
import { useInventoryContext } from "../../contexts/InventoryContext";
// Components
import InventoryCard from "./InventoryCard";

const LowestInventory = () => {
  const { inventory, fetchInventory } = useInventoryContext();

  const fetchLowestInventory = (inventory) => {
    return inventory
      .sort((a, b) => a.quantity_in_stock - b.quantity_in_stock)
      .slice(0, 5);
  };
  let lowestInventory = fetchLowestInventory(inventory);

  useEffect(() => {
    fetchInventory({}, "name");
  }, []);

  return (
    <>
      <h3>Lowest Inventory parts</h3>
      {/* latest reports list with card display */}
      <div className="list">
        {lowestInventory.length > 0 ? (
          lowestInventory.map((item) => (
            <InventoryCard key={item.id} item={item} />
          ))
        ) : (
          <p>No parts found.</p>
        )}
      </div>
    </>
  );
};
export default LowestInventory;
