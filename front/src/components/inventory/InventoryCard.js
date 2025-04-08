import { useLocation } from "react-router-dom";
// Components
import InventoryModal from "./InventoryModal";
// Contexts
import { useInventoryContext } from "../../contexts/InventoryContext";
import { useGlobalContext } from "../../contexts/GlobalContext";

const InventoryCard = ({ item }) => {
  const cardItemType = "Inventory part";

  const location = useLocation();
  const isPathInventory = location.pathname.includes("inventory");

  const { deleteInventoryPartWithAlert } = useInventoryContext();
  const { openModal, openDeleteModal } = useGlobalContext();

  const isLowerThan10 = (item) => {
    if (item.quantity_in_stock < 10) return true;
    return false;
  };

  return (
    <div
      key={item.id}
      className={isLowerThan10(item) ? "card low-inventory" : "card"}
      title="View inventory part"
      onClick={(e) => {
        // Prevent triggering view mode if clicking on an action button
        if (!e.target.closest(".actions")) {
          openModal(InventoryModal, item, cardItemType, true);
        }
      }}
    >
      <div className="card-content">
        <section>
          <header>{item.name}</header>
          <div>
            <p>
              <strong>Reference:</strong>&nbsp;{item.reference_code}
            </p>
            <p>
              <strong>Quantity:</strong>&nbsp;{item.quantity_in_stock}
            </p>
            {isPathInventory && (
              <>
                <p>
                  <strong>Category:</strong>&nbsp;
                  {item.category}
                </p>
                <p>
                  <strong>Unit price:</strong>&nbsp;
                  {item.unit_price}
                </p>
              </>
            )}
          </div>
        </section>
        <section className="actions">
          {isPathInventory && (
            <>
              <button
                title="Edit inventory part"
                className="btn btn-edit"
                onClick={() =>
                  openModal(InventoryModal, item, cardItemType, false)
                }
              >
                Edit
              </button>
              <button
                title="Delete inventory part"
                className="btn btn-delete"
                onClick={() =>
                  openDeleteModal(
                    item,
                    cardItemType,
                    () => deleteInventoryPartWithAlert
                  )
                }
              >
                Delete
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
export default InventoryCard;
