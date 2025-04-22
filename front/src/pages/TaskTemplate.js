import { useState, useEffect } from 'react'
// Utils
import getFilterOptions from '../utils/filterBarFilterOptions'
// Components
import Page from '../components/Page'
import TaskTemplateCard from '../components/task-templates/TaskTemplateCard'
import TaskTemplateModal from '../components/task-templates/TaskTemplateModal'
// Zustand
import useTaskTemplateStore from '../stores/useTaskTemplateStore'
// Contexts
import { useGlobalContext } from '../contexts/GlobalContext'

const TaskTemplate = () => {
  const { taskTemplates, loading } = useTaskTemplateStore()
  const { setModalState } = useGlobalContext()

  const [filters, setFilters] = useState({
    search: '',
  })

  useEffect(() => {
    setModalState((prev) => ({
      ...prev,
      modalComponent: TaskTemplateModal,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
