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

const TaskTemplate = () => {
  const { taskTemplate, deleteTaskTemplateWithAlert } = useInventoryContext();
  const [filters, setFilters] = useState({
    name: "",
    description: "",
    price: "",
  });

  return (
    <Page
      itemType="Task template"
      filters={{ ...filters, type: "task_template" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).taskTemplate}
      sortingCardFunction={(a, b) => a.__str__.localeCompare(b.__str__)}
      items={taskTemplate}
      deleteItemWithAlert={deleteTaskTemplateWithAlert}
      CardComponent={InventoryCard}
      ModalComponent={InventoryModal}
    />
  );
};

export default TaskTemplate;
