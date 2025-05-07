import { act } from '@testing-library/react'
import useReportStore from '../../stores/useReportStore'
import axiosInstance from '../../utils/axiosInstance'

jest.mock('../../utils/axiosInstance')

describe('useReportStore', () => {
  beforeEach(() => {
    useReportStore.setState({
      reports: [],
      pagination: null,
      loading: false,
      error: null,
    })
  })

  it('fetches reports (paginated)', async () => {
    axiosInstance.get.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 1, title: 'Report 1' }],
      },
    })

    await act(async () => {
      await useReportStore.getState().fetchReports({})
    })

    const { reports, pagination } = useReportStore.getState()
    expect(reports).toHaveLength(1)
    expect(reports[0].title).toBe('Report 1')
    expect(pagination.count).toBe(1)
  })

  it('creates a report', async () => {
    const mockReport = { id: 2, title: 'New Report' }
    axiosInstance.post.mockResolvedValue({ data: mockReport })

    await act(async () => {
      await useReportStore.getState().createReport({ title: 'New Report' })
    })

    const { reports } = useReportStore.getState()
    expect(reports.find((r) => r.id === 2)).toBeTruthy()
  })

  it('updates a report', async () => {
    useReportStore.setState({ reports: [{ id: 3, title: 'Old' }] })
    const updated = { id: 3, title: 'Updated Report' }
    axiosInstance.patch.mockResolvedValue({ data: updated })

    await act(async () => {
      await useReportStore.getState().updateReport(3, { title: 'Updated Report' })
    })

    const { reports } = useReportStore.getState()
    expect(reports.find((r) => r.id === 3).title).toBe('Updated Report')
  })

  it('deletes a report', async () => {
    useReportStore.setState({ reports: [{ id: 4, title: 'To Delete' }] })
    axiosInstance.delete.mockResolvedValue({ data: {} })

    await act(async () => {
      await useReportStore.getState().deleteReport(4)
    })

    const { reports } = useReportStore.getState()
    expect(reports.find((r) => r.id === 4)).toBeUndefined()
  })

  it('sets error on fetch failure', async () => {
    axiosInstance.get.mockRejectedValue(new Error('Failed to fetch'))

    await act(async () => {
      await useReportStore.getState().fetchReports({})
    })

    const { error } = useReportStore.getState()
    expect(error).toBe('Failed to fetch')
  })
})
