jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Keep the actual exports for the things you use
  BrowserRouter: ({ children }) => <div>{children}</div>, // Mock BrowserRouter as a simple wrapper
  Route: ({ element }) => element, // Mock Route component by just rendering its element
  Routes: ({ children }) => <div>{children}</div>, // Mock Routes component
  Navigate: ({ to }) => <div>Navigate to {to}</div>, // Mock Navigate component
}))

import React, { Suspense } from 'react'
import { render, screen } from '@testing-library/react'

// Component under test
import App from './App'

// Mocks
jest.mock('./contexts/AuthContext', () => {
  return {
    __esModule: true,
    useAuth: jest.fn(),
    AuthProvider: ({ children }) => <>{children}</>,
  }
})

jest.mock('./contexts/GlobalContext', () => {
  return {
    __esModule: true,
    useGlobalContext: jest.fn(),
    GlobalProvider: ({ children }) => <>{children}</>,
  }
})

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    mixin: () => ({
      fire: jest.fn(),
    }),
  },
}))

// Mock page components (NO React.lazy inside mock)
jest.mock('./pages/Dashboard', () => ({
  __esModule: true,
  default: () => <div>Mocked Dashboard</div>,
}))

jest.mock('./components/authentication/Login', () => ({
  __esModule: true,
  default: () => <div>Mocked Login</div>,
}))

jest.mock('./pages/Report', () => ({
  __esModule: true,
  default: () => <div>Mocked Report</div>,
}))

jest.mock('./pages/Owner', () => ({
  __esModule: true,
  default: () => <div>Mocked Owner</div>,
}))

jest.mock('./components/reports/ReportModal', () => ({
  __esModule: true,
  default: () => <div>Mocked Modal</div>,
}))

// Get the mocked hooks
import { useAuth } from './contexts/AuthContext'
import { useGlobalContext } from './contexts/GlobalContext'

import ReportModal from './components/reports/ReportModal'

const mockUseAuth = useAuth
const mockUseGlobal = useGlobalContext

describe('App routing', () => {
  it('renders login screen when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      authenticatedUser: null,
      loadingAuth: false,
    })
    mockUseGlobal.mockReturnValue({ modalState: {} })

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>,
    )

    expect(await screen.findByText(/mocked login/i)).toBeInTheDocument()
  })

  it('renders dashboard when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      authenticatedUser: { id: 1, username: 'Test User' },
      loadingAuth: false,
    })
    mockUseGlobal.mockReturnValue({ modalState: {} })

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>,
    )

    expect(await screen.findByText(/mocked dashboard/i)).toBeInTheDocument()
  })

  it('renders modal if present', async () => {
    mockUseAuth.mockReturnValue({
      authenticatedUser: { id: 1, username: 'Test User' },
      loadingAuth: false,
    })
    mockUseGlobal.mockReturnValue({
      modalState: {
        isModalReady: true,
        showModal: 'custom',
        modalComponent: ReportModal,
      },
    })

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>,
    )

    expect(await screen.findByText(/mocked modal/i)).toBeInTheDocument()
  })
})
