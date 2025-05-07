jest.mock('../../stores/useReportStore', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    mixin: () => ({
      fire: jest.fn(),
    }),
  },
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}))

import useReportStore from '../../stores/useReportStore'
import { render, screen } from '@testing-library/react'
import Report from '../../pages/Report'

jest.mock('../../components/Page', () => ({
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
