// hooks/useReportModal.js
import { useState, useCallback, useEffect } from 'react'

export const useReportModal = (
  taskTemplates,
  inventory,
  tasks = [],
  parts = [],
  isEditMode = false,
  showModal = false,
) => {
  const [taskIds, setTaskIds] = useState([]) // { taskId } task_template in the task model
  const [partsUsed, setPartsUsed] = useState([]) // { partId, quantity_used } part and quantity_used in the part model
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedPartId, setSelectedPartId] = useState('')
  const [quantityPart, setQuantityPart] = useState(1)

  // Reset form when modal is closed
  useEffect(() => {
    if (!showModal) {
      setTaskIds([])
      setPartsUsed([])
      setSelectedTaskId('')
      setSelectedPartId('')
      setQuantityPart(1)
    }
  }, [showModal])

  // Rehydrate tasks and parts when opening edit modal
  useEffect(() => {
    if (showModal && isEditMode) {
      // Validate and extract task IDs
      const validTaskIds = tasks
        .filter((task) => taskTemplates?.some((t) => t.id === task.task_template))
        .map((task) => task.task_template)

      // Validate and extract parts
      const validPartsUsed = parts
        .filter((part) => inventory?.some((item) => item.id === part.part))
        .map((part) => ({
          partId: part.part,
          quantity_used: part.quantity_used,
        }))

      setTaskIds(validTaskIds)
      setPartsUsed(validPartsUsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal])

  // TASKS
  // Handle <select> change by extracting selected ID
  const handleTaskChange = (e) => setSelectedTaskId(Number(e.target.value))

  const addTask = useCallback(() => {
    if (!selectedTaskId || taskIds.includes(selectedTaskId)) return
    setTaskIds((prev) => [...prev, selectedTaskId])
    setSelectedTaskId('')
  }, [selectedTaskId, taskIds])

  const removeTask = useCallback((taskId) => {
    setTaskIds((prev) => prev.filter((id) => id !== taskId))
  }, [])

  // PARTS
  // Handle <select> change by extracting selected ID
  const handlePartChange = (e) => setSelectedPartId(Number(e.target.value))

  const addPart = useCallback(() => {
    if (!selectedPartId || quantityPart <= 0) return

    setPartsUsed((prev) => {
      const partExists = prev.some((p) => p.partId === selectedPartId)

      if (partExists) {
        return prev.map((p) =>
          p.partId === selectedPartId
            ? {
                ...p,
                quantity_used:
                  (Math.round(p.quantity_used * 100) + Math.round(quantityPart * 100)) / 100,
              }
            : p,
        )
      } else {
        return [...prev, { partId: selectedPartId, quantity_used: quantityPart }]
      }
    })

    setSelectedPartId('')
    setQuantityPart(1)
  }, [selectedPartId, quantityPart])

  const removePart = useCallback((partId) => {
    setPartsUsed((prev) => prev.filter((p) => p.partId !== partId))
  }, [])

  return {
    // State
    taskIds,
    partsUsed,
    selectedTaskId,
    selectedPartId,
    quantityPart,

    // Setters
    setSelectedTaskId,
    setSelectedPartId,
    setQuantityPart,

    // Handlers
    handleTaskChange,
    handlePartChange,
    addTask,
    removeTask,
    addPart,
    removePart,
  }
}
