import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReportModal from '../../components/reports/ReportModal'

// Mocks
vi.mock('../../contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ authenticatedUser: { id: 1 } }),
}))
vi.mock('../../contexts/GlobalContext', () => ({
  __esModule: true,
  useGlobalContext: () => ({
    modalState: { selectedItem: null, showModal: true, readonly: false, itemType: 'report' },
    openDeleteModal: vi.fn(),
    closeModals: vi.fn(),
    toggleReadonly: vi.fn(),
  }),
}))
vi.mock('../../stores/useVehicleStore', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    vehicles: [],
  })),
}))
vi.mock('../../stores/useOwnerStore', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    owners: [],
  })),
}))
vi.mock('../../stores/useInventoryStore', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    inventory: [],
  })),
}))
vi.mock('../../stores/useTaskTemplateStore', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    taskTemplates: [],
  })),
}))
vi.mock('../../stores/useReportStore', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    reports: [],
    createReport: vi.fn(),
    updateReport: vi.fn(),
    deleteReport: vi.fn(),
    loading: false,
  })),
}))
vi.mock('../../hooks/useReportModal', () => ({
  __esModule: true,
  useReportModal: () => ({
    taskIds: [],
    partsUsed: [],
    selectedTaskId: '',
    selectedPartId: '',
    quantityPart: '',
    setQuantityPart: vi.fn(),
    handleTaskChange: vi.fn(),
    handlePartChange: vi.fn(),
    addTask: vi.fn(),
    removeTask: vi.fn(),
    addPart: vi.fn(),
    removePart: vi.fn(),
  }),
}))
vi.mock('../../hooks/useReportForm', () => ({
  __esModule: true,
  useReportForm: () => ({
    data: { vehicle: '', status: 'pending', remarks: '', user: 1 },
    errors: {},
    handleChange: vi.fn(),
    isValid: true,
  }),
}))
vi.mock('../../utils/sweetalert', () => ({
  __esModule: true,
  Toast: { fire: vi.fn() },
}))
vi.mock('../../utils/successAlert', () => ({
  __esModule: true,
  default: (fn) => fn,
}))
vi.mock('../../utils/getOwnerNameByVehicleId', () => ({
  __esModule: true,
  getOwnerNameByVehicleId: () => 'John Doe',
}))
vi.mock('../../utils/stringUtils', () => ({
  __esModule: true,
  formatQuantity: (val) => val,
}))

describe('ReportModal', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <ReportModal />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Vehicle')).toBeInTheDocument()
    expect(screen.getAllByText(/Create Report/i).length).toBeGreaterThan(0)
  })
})
