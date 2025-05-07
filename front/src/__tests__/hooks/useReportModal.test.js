import { renderHook, act, waitFor } from '@testing-library/react'
import { useReportModal } from '../../hooks/useReportModal'

describe('useReportModal', () => {
  const taskTemplates = [{ id: 1 }, { id: 2 }]
  const inventory = [
    { id: 10, name: 'Part 1' },
    { id: 20, name: 'Part 2' },
  ]
  const tasks = []
  const parts = []

  it('can add and remove tasks', async () => {
    const { result } = renderHook(() => useReportModal(taskTemplates, inventory, tasks, parts))

    // Initially no tasks
    expect(result.current.taskIds).toEqual([])

    // Set taskId
    act(() => {
      result.current.setSelectedTaskId(1)
    })

    // Wait for the update to take effect
    await waitFor(() => expect(result.current.selectedTaskId).toBe(1))

    // Add task
    act(() => {
      result.current.addTask()
    })

    // Expect task with ID 1 to be added
    expect(result.current.taskIds).toEqual([1])

    // Remove task with ID 1
    act(() => {
      result.current.removeTask(1)
    })

    // Expect tasks to be empty after removal
    expect(result.current.taskIds).toEqual([])
  })

  it('prevents adding duplicate tasks', () => {
    const { result } = renderHook(() => useReportModal(taskTemplates, inventory, tasks, parts))

    // Add task with ID 1
    act(() => {
      result.current.setSelectedTaskId(1)
      result.current.addTask()
    })

    // Try to add the same task again
    act(() => {
      result.current.addTask()
    })

    // Expect no duplicates
    expect(result.current.taskIds).toEqual([1])
  })

  it('can add and remove parts', async () => {
    const { result } = renderHook(() => useReportModal(taskTemplates, inventory, tasks, parts))

    // Initially no parts
    expect(result.current.partsUsed).toEqual([])

    // Set partId
    act(() => {
      result.current.setSelectedPartId(10)
      result.current.setQuantityPart(2)
    })

    // Wait for the update to take effect
    await waitFor(() => {
      expect(result.current.selectedPartId).toBe(10)
      expect(result.current.quantityPart).toBe(2)
    })

    // Add part
    act(() => {
      result.current.addPart()
    })

    // Expect part with ID 10 and quantity 2 to be added
    expect(result.current.partsUsed).toEqual([{ partId: 10, quantity_used: 2 }])

    // Remove part with ID 10
    act(() => {
      result.current.removePart(10)
    })

    // Expect parts to be empty after removal
    expect(result.current.partsUsed).toEqual([])
  })

  it('accumulates quantity when same part is added again', async () => {
    const { result } = renderHook(() => useReportModal(taskTemplates, inventory, tasks, parts))

    // Add part with ID 10 and quantity 2
    // Set partId
    act(() => {
      result.current.setSelectedPartId(10)
      result.current.setQuantityPart(2)
    })

    // Wait for the update to take effect
    await waitFor(() => {
      expect(result.current.selectedPartId).toBe(10)
      expect(result.current.quantityPart).toBe(2)
    })

    // Add part
    act(() => {
      result.current.addPart()
    })

    // Add part with the same ID 10 but quantity 1.5
    // Set partId
    act(() => {
      result.current.setSelectedPartId(10)
      result.current.setQuantityPart(1.5)
    })

    // Wait for the update to take effect
    await waitFor(() => {
      expect(result.current.selectedPartId).toBe(10)
      expect(result.current.quantityPart).toBe(1.5)
    })

    // Add part
    act(() => {
      result.current.addPart()
    })

    // Expect part 10 with accumulated quantity (2 + 1.5 = 3.5)
    await waitFor(() => {
      expect(result.current.partsUsed).toEqual([{ partId: 10, quantity_used: 3.5 }])
    })
  })

  it('does not add part if selectedPartId is falsy or quantity <= 0', async () => {
    const { result } = renderHook(() => useReportModal(taskTemplates, inventory, tasks, parts))

    // Try adding part with id='' and quantity 2
    // Set partId
    act(() => {
      result.current.setSelectedPartId('')
      result.current.setQuantityPart(2)
    })

    // Wait for the update to take effect
    await waitFor(() => {
      expect(result.current.selectedPartId).toBe('')
      expect(result.current.quantityPart).toBe(2)
    })

    // Add part
    act(() => {
      result.current.addPart()
    })

    expect(result.current.partsUsed).toEqual([])

    // Add part with ID 10 and quantity 0
    // Set partId
    act(() => {
      result.current.setSelectedPartId(10)
      result.current.setQuantityPart(0)
    })

    // Wait for the update to take effect
    await waitFor(() => {
      expect(result.current.selectedPartId).toBe(10)
      expect(result.current.quantityPart).toBe(0)
    })

    // Add part
    act(() => {
      result.current.addPart()
    })

    expect(result.current.partsUsed).toEqual([])

    // Try adding part with valid ID and quantity
    // Add part with ID 10 and quantity 2
    // Set partId
    act(() => {
      result.current.setSelectedPartId(10)
      result.current.setQuantityPart(2)
    })

    // Wait for the update to take effect
    await waitFor(() => {
      expect(result.current.selectedPartId).toBe(10)
      expect(result.current.quantityPart).toBe(2)
    })

    // Add part
    act(() => {
      result.current.addPart()
    })

    expect(result.current.partsUsed).toEqual([{ partId: 10, quantity_used: 2 }])
  })
})
