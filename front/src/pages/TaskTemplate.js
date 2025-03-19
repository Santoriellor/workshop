import { useState, useEffect } from "react";
// Utils
import getFilterOptions from "../utils/filterBarFilterOptions";
// Components
import Page from "../components/Page";
import TaskTemplateCard from "../components/task-templates/TaskTemplateCard";
import TaskTemplateModal from "../components/task-templates/TaskTemplateModal";
// Contexts
import { useInventoryContext } from "../contexts/InventoryContext";
import { useGlobalContext } from "../contexts/GlobalContext";

const TaskTemplate = () => {
  const { taskTemplate, loadingTaskTemplate, deleteTaskTemplateWithAlert } =
    useInventoryContext();
  const { setModalComponent } = useGlobalContext();

  const [filters, setFilters] = useState({
    search: "",
  });

  useEffect(() => {
    setModalComponent(() => TaskTemplateModal);
  }, []);

  return (
    <Page
      itemType="task"
      filters={{ ...filters, type: "task_template" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).task_template}
      items={taskTemplate}
      deleteItemWithAlert={deleteTaskTemplateWithAlert}
      CardComponent={TaskTemplateCard}
      ModalComponent={TaskTemplateModal}
      loadingItem={loadingTaskTemplate}
    />
  );
};

export default TaskTemplate;
