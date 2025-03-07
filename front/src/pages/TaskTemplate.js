import { useState } from "react";
// Utils
import getFilterOptions from "../utils/filterBarFilterOptions";
// Components
import Page from "../components/Page";
import TaskTemplateCard from "../components/TaskTemplateCard";
import TaskTemplateModal from "../components/TaskTemplateModal";
// Contexts
import { useInventoryContext } from "../contexts/InventoryContext";

const TaskTemplate = () => {
  const { taskTemplate, deleteTaskTemplateWithAlert } = useInventoryContext();
  const [filters, setFilters] = useState({
    search: "",
  });

  return (
    <Page
      itemType="Task template"
      filters={{ ...filters, type: "task_template" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).task_template}
      sortingCardFunction={(a, b) => a.name.localeCompare(b.name)}
      items={taskTemplate}
      deleteItemWithAlert={deleteTaskTemplateWithAlert}
      CardComponent={TaskTemplateCard}
      ModalComponent={TaskTemplateModal}
    />
  );
};

export default TaskTemplate;
