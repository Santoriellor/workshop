import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
// Zustand stores
import useTaskTemplateStore from '../../stores/useTaskTemplateStore'

const TaskTemplateFetcher = () => {
  const location = useLocation()
  const { taskTemplates, fetchTaskTemplates } = useTaskTemplateStore()

  useEffect(() => {
    const paths = ['/tasktemplate', '/report', '/dashboard', '/invoices']
    if (paths.includes(location.pathname)) {
      let filters = {}
      let ordering = 'name'
      let limit = null
      let offset = null

      fetchTaskTemplates({ ...filters, ordering, limit, offset })
    }
  }, [location.pathname, taskTemplates.length, fetchTaskTemplates])

  return null
}

export default TaskTemplateFetcher
