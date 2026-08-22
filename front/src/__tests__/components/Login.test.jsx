import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

import { useAuth } from '../../contexts/AuthContext'
import Login from '../../components/authentication/Login'

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )

describe('Login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('disables the submit button while authentication is in flight', () => {
    useAuth.mockReturnValue({ login: vi.fn(), loadingAuth: true })

    renderLogin()

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled()
  })

  it('disables the submit button while the form is empty', () => {
    useAuth.mockReturnValue({ login: vi.fn(), loadingAuth: false })

    renderLogin()

    expect(screen.getByRole('button', { name: /^login$/i })).toBeDisabled()
  })
})
