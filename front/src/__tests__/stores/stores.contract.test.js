import { act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/axiosInstance')

import axiosInstance from '../../utils/axiosInstance'
import useOwnerStore from '../../stores/useOwnerStore'
import useInventoryStore from '../../stores/useInventoryStore'

describe('useOwnerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOwnerStore.setState({ owners: [], loading: false, error: null })
  })

  it('stores the response body verbatim, because owners are never paginated', async () => {
    axiosInstance.get.mockResolvedValue({ data: [{ id: 1, first_name: 'Ada' }] })

    await act(async () => {
      await useOwnerStore.getState().fetchOwners()
    })

    expect(useOwnerStore.getState().owners).toHaveLength(1)
    expect(useOwnerStore.getState().loading).toBe(false)
  })

  it('appends the ordering parameter to the query string', async () => {
    axiosInstance.get.mockResolvedValue({ data: [] })

    await act(async () => {
      await useOwnerStore.getState().fetchOwners({}, 'full_name')
    })

    expect(axiosInstance.get).toHaveBeenCalledWith('/owners/?ordering=full_name')
  })

  it('records the error message and stops loading on failure', async () => {
    axiosInstance.get.mockRejectedValue(new Error('boom'))

    await act(async () => {
      await useOwnerStore.getState().fetchOwners()
    })

    expect(useOwnerStore.getState().error).toBe('boom')
    expect(useOwnerStore.getState().loading).toBe(false)
  })
})

describe('useInventoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useInventoryStore.setState({
      inventory: [],
      pagination: null,
      loading: false,
      error: null,
    })
  })

  it('unwraps the pagination envelope when the API returns one', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { count: 9, next: 'n', previous: null, results: [{ id: 1 }] },
    })

    await act(async () => {
      await useInventoryStore.getState().fetchInventory({ limit: 1 })
    })

    const state = useInventoryStore.getState()
    expect(state.inventory).toHaveLength(1)
    expect(state.pagination).toEqual({ count: 9, next: 'n', previous: null })
  })

  it('leaves pagination null when the API returns a bare array', async () => {
    axiosInstance.get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] })

    await act(async () => {
      await useInventoryStore.getState().fetchInventory()
    })

    const state = useInventoryStore.getState()
    expect(state.inventory).toHaveLength(2)
    expect(state.pagination).toBeNull()
  })

  it('drops null and undefined parameters from the query string', async () => {
    axiosInstance.get.mockResolvedValue({ data: [] })

    await act(async () => {
      await useInventoryStore.getState().fetchInventory({ name: 'Oil', category: null })
    })

    expect(axiosInstance.get).toHaveBeenCalledWith('/inventory/?name=Oil')
  })
})
