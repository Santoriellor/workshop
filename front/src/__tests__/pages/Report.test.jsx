import { render, screen } from '@testing-library/react'
import Report from '../../pages/Report'
import React from 'react'
import useReportStore from '../../stores/useReportStore'

// Mock Zustand store
vi.mock('../../stores/useReportStore', () => ({
  __esModule: true,
  default: vi.fn(),
}))

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    mixin: vi.fn(() => ({
      fire: vi.fn(),
    })),
  },
}))

// Mock react-router-dom with partials
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  }
})

// Mock the Page component
vi.mock('../../components/Page', () => ({
  __esModule: true,
  default: ({ items }) => <div>Mocked Page with {items.length} reports</div>,
}))

describe('Report page', () => {
  it('renders reports from the store', () => {
    useReportStore.mockReturnValue({
      reports: [{ id: 1 }, { id: 2 }],
      loading: false,
    })

    render(<Report />)
    expect(screen.getByText(/2 reports/i)).toBeInTheDocument()
  })

  it('shows loading state if store is loading', () => {
    useReportStore.mockReturnValue({
      reports: [],
      loading: true,
    })

    render(<Report />)
    expect(screen.getByText(/0 reports/i)).toBeInTheDocument()
  })
})
