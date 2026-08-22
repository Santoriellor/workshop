import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const navigateSpy = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateSpy }
})

vi.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: vi.fn(), mixin: () => ({ fire: vi.fn() }) },
}))

vi.mock('../../utils/axiosInstance', () => ({
  __esModule: true,
  default: { get: vi.fn(), post: vi.fn() },
  setAxiosToken: vi.fn(),
  API_BASE_URL: 'http://test.invalid/api',
}))

import axiosInstance from '../../utils/axiosInstance'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'

const Probe = () => {
  const { authenticatedUser, loadingAuth, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="user">
        {authenticatedUser ? authenticatedUser.username : 'anonymous'}
      </span>
      <span data-testid="loading">{String(loadingAuth)}</span>
      <button onClick={() => login('ada@example.com', 'pw')}>do-login</button>
      <button onClick={() => logout()}>do-logout</button>
    </div>
  )
}

const renderProbe = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  )

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('starts anonymous when localStorage holds no token', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
    expect(axiosInstance.get).not.toHaveBeenCalled()
  })

  it('hydrates the current user from /users/me/ when a token is stored', async () => {
    localStorage.setItem('token', 'stored-token')
    axiosInstance.get.mockResolvedValue({
      data: { id: 1, username: 'ada', email: 'ada@example.com' },
    })

    renderProbe()

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('ada'))
    expect(axiosInstance.get).toHaveBeenCalledWith('/users/me/', expect.anything())
  })

  it('stores both tokens on login and then loads the profile', async () => {
    axiosInstance.post.mockResolvedValue({
      data: { access: 'access-token', refresh: 'refresh-token' },
    })
    axiosInstance.get.mockResolvedValue({
      data: { id: 1, username: 'ada', email: 'ada@example.com' },
    })

    renderProbe()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await userEvent.click(screen.getByText('do-login'))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('ada'))
    expect(localStorage.getItem('token')).toBe('access-token')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token')
    expect(axiosInstance.post).toHaveBeenCalledWith('/login/', {
      email: 'ada@example.com',
      password: 'pw',
    })
  })

  it('clears both tokens and navigates to /login on logout', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('refreshToken', 'stored-refresh')
    axiosInstance.get.mockResolvedValue({
      data: { id: 1, username: 'ada', email: 'ada@example.com' },
    })

    renderProbe()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('ada'))
    await userEvent.click(screen.getByText('do-logout'))

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
    expect(navigateSpy).toHaveBeenCalledWith('/login')
  })
})
