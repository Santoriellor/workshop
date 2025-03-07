import { useNavigate } from "react-router-dom";
// Contexts
import { useInventoryContext } from "../contexts/InventoryContext";
// Components
import InventoryCard from "./InventoryCard";

const LowestInventory = () => {
  const navigate = useNavigate();
  const { inventory } = useInventoryContext();

  const fetchLowestInventory = (inventory) => {
    return inventory
      .sort((a, b) => a.quantity_in_stock - b.quantity_in_stock)
      .slice(0, 5);
  };
  let lowestInventory = fetchLowestInventory(inventory);

  const handleViewClick = (type, id) => {
    navigate(`/${type}`, { state: { viewItemId: id } });
  };
  const handleEditClick = (item) => {
    console.log("Edit item", item);
  };
  const handleDeleteClick = (item) => {
    console.log("Delete item", item);
  };

  return (
    <>
      <h3>Lowest Inventory parts</h3>
      {/* latest reports list with card display */}
      <div className="list">
        {lowestInventory.length > 0 ? (
          lowestInventory.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              handleViewClick={() => handleViewClick("inventory", item.id)}
              handleEditClick={handleEditClick}
              handleDeleteClick={handleDeleteClick}
            />
          ))
        ) : (
          <p>No report match your filters.</p>
        )}
      </div>
    </>
  );
};
export default LowestInventory;
