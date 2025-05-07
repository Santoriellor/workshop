import React, { Suspense } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// Component under test
import App from './App'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
  }
})

// Mock Contexts
vi.mock('./contexts/AuthContext', async () => {
  const actual = await vi.importActual('./contexts/AuthContext')
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

vi.mock('./contexts/GlobalContext', async () => {
  const actual = await vi.importActual('./contexts/GlobalContext')
  return {
    ...actual,
    useGlobalContext: vi.fn(),
  }
})

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    mixin: () => ({
      fire: vi.fn(),
    }),
  },
}))

// Mock pages
vi.mock('./pages/Dashboard', () => ({
  __esModule: true,
  default: () => <div>Mocked Dashboard</div>,
}))

vi.mock('./components/authentication/Login', () => ({
  __esModule: true,
  default: () => <div>Mocked Login</div>,
}))

vi.mock('./pages/Report', () => ({
  __esModule: true,
  default: () => <div>Mocked Report</div>,
}))

vi.mock('./pages/Owner', () => ({
  __esModule: true,
  default: () => <div>Mocked Owner</div>,
}))

vi.mock('./components/reports/ReportModal', () => ({
  __esModule: true,
  default: () => <div>Mocked Modal</div>,
}))

vi.mock('./components/Sidebar', () => ({
  __esModule: true,
  default: () => <div>Mocked Sidebar</div>,
}))

// Grab mocked hooks
import { useAuth } from './contexts/AuthContext'
import { useGlobalContext } from './contexts/GlobalContext'
import ReportModal from './components/reports/ReportModal'

describe('App routing', () => {
  it('renders login screen when user is not authenticated', async () => {
    useAuth.mockReturnValue({
      authenticatedUser: null,
      loadingAuth: false,
    })
    useGlobalContext.mockReturnValue({ modalState: {} })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/mocked login/i)).toBeInTheDocument()
  })

  it('renders dashboard when authenticated', async () => {
    useAuth.mockReturnValue({
      authenticatedUser: { id: 1, username: 'Test User' },
      loadingAuth: false,
    })
    useGlobalContext.mockReturnValue({ modalState: {} })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/mocked dashboard/i)).toBeInTheDocument()
  })

  it('renders modal if present', async () => {
    useAuth.mockReturnValue({
      authenticatedUser: { id: 1, username: 'Test User' },
      loadingAuth: false,
    })
    useGlobalContext.mockReturnValue({
      modalState: {
        isModalReady: true,
        showModal: 'custom',
        modalComponent: ReportModal,
      },
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/mocked modal/i)).toBeInTheDocument()
  })
})
