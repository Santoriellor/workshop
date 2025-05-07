import { useState } from 'react'
// Utils
import getFilterOptions from '../utils/filterBarFilterOptions'
// Components
import Page from '../components/Page'
import TaskTemplateCard from '../components/task-templates/TaskTemplateCard'
// Zustand
import useTaskTemplateStore from '../stores/useTaskTemplateStore'

const TaskTemplate = () => {
  const { taskTemplates, loading } = useTaskTemplateStore()
  const [filters, setFilters] = useState({
    search: '',
  })

  return (
    <Page
      itemType="task"
      filters={{ ...filters, type: 'task_template' }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).task_template}
      items={taskTemplates}
      CardComponent={TaskTemplateCard}
      loadingItem={loading}
    />
  )
}

export default TaskTemplate
