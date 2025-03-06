import { useState } from "react";
// Utils
import getFilterOptions from "../utils/filterBarFilterOptions";
// Components
import Page from "../components/Page";
import InventoryCard from "../components/InventoryCard";
import InventoryModal from "../components/InventoryModal";
// Contexts
import { useInventoryContext } from "../contexts/InventoryContext";
// Styles
import "../styles/Inventory.css";

const Inventory = () => {
  const { inventory, deleteInventoryPartWithAlert } = useInventoryContext();
  const [filters, setFilters] = useState({
    part_name: "",
    reference_code: "",
    category: "",
    quantity_in_stock: "",
    unit_price: "",
    updated_at: "",
  });

  return (
    <Page
      itemType="part"
      filters={{ ...filters, type: "inventory" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).inventory}
      sortingCardFunction={(a, b) => a.name.localeCompare(b.name)}
      items={inventory}
      deleteItemWithAlert={deleteInventoryPartWithAlert}
      CardComponent={InventoryCard}
      ModalComponent={InventoryModal}
    />
  );
};

export default Inventory;
