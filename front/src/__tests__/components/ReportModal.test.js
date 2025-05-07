import { render, screen } from '@testing-library/react'
import ReportModal from '../../components/reports/ReportModal'

// Mocks
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ authenticatedUser: { id: 1 } }),
}))
jest.mock('../../contexts/GlobalContext', () => ({
  useGlobalContext: () => ({
    modalState: { selectedItem: null, showModal: true, readonly: false, itemType: 'report' },
    openDeleteModal: jest.fn(),
    closeModals: jest.fn(),
    toggleReadonly: jest.fn(),
  }),
}))
jest.mock('../../stores/useVehicleStore', () => () => ({ vehicles: [] }))
jest.mock('../../stores/useOwnerStore', () => () => ({ owners: [] }))
jest.mock('../../stores/useInventoryStore', () => () => ({ inventory: [] }))
jest.mock('../../stores/useTaskTemplateStore', () => () => ({ taskTemplates: [] }))
jest.mock('../../stores/useReportStore', () => () => ({
  createReport: jest.fn(),
  updateReport: jest.fn(),
  deleteReport: jest.fn(),
  loading: false,
}))
jest.mock('../../hooks/useReportModal', () => ({
  useReportModal: () => ({
    taskIds: [],
    partsUsed: [],
    selectedTaskId: '',
    selectedPartId: '',
    quantityPart: '',
    setQuantityPart: jest.fn(),
    handleTaskChange: jest.fn(),
    handlePartChange: jest.fn(),
    addTask: jest.fn(),
    removeTask: jest.fn(),
    addPart: jest.fn(),
    removePart: jest.fn(),
  }),
}))
jest.mock('../../hooks/useReportForm', () => ({
  useReportForm: () => ({
    data: { vehicle: '', status: 'pending', remarks: '', user: 1 },
    errors: {},
    handleChange: jest.fn(),
    isValid: true,
  }),
}))
jest.mock('../../utils/sweetalert', () => ({
  Toast: { fire: jest.fn() },
}))
jest.mock('../../utils/successAlert', () => (fn) => fn)
jest.mock('../../utils/getOwnerNameByVehicleId', () => ({
  getOwnerNameByVehicleId: () => 'John Doe',
}))
jest.mock('../../utils/stringUtils', () => ({
  formatQuantity: (val) => val,
}))

describe('ReportModal', () => {
  it('renders without crashing', () => {
    render(<ReportModal />)
    expect(screen.getByLabelText('Vehicle')).toBeInTheDocument()
    expect(screen.getAllByText(/Create Report/i).length).toBeGreaterThan(0)
  })
})
