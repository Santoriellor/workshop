import { describe, it, expect, vi, beforeEach } from 'vitest'

// authUtils is mocked because the real refreshToken performs a network call and
// imports back into axiosInstance, which would be a cycle in the test graph.
vi.mock('../../utils/authUtils', () => ({
  refreshToken: vi.fn(),
  logout: vi.fn(),
}))

import axiosInstance, { setAxiosToken } from '../../utils/axiosInstance'
import { refreshToken, logout } from '../../utils/authUtils'

/**
 * Reads the Authorization header from a request config. axios 0.x hands the
 * adapter a plain object; axios 1.x hands it an AxiosHeaders instance. This
 * helper works with both, so these assertions survive Task 14 unchanged.
 */
const authHeader = (config) =>
  typeof config.headers?.get === 'function'
    ? config.headers.get('Authorization')
    : config.headers?.Authorization

describe('axiosInstance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete axiosInstance.defaults.headers.common['Authorization']
  })

  it('sends every request to VITE_API_URL', () => {
    expect(axiosInstance.defaults.baseURL).toBe(import.meta.env.VITE_API_URL)
  })

  it('attaches the token given to setAxiosToken as a bearer credential', async () => {
    const seen = []
    axiosInstance.defaults.adapter = async (config) => {
      seen.push(config)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    setAxiosToken('first-token')
    await axiosInstance.get('/owners/')

    expect(seen).toHaveLength(1)
    expect(authHeader(seen[0])).toBe('Bearer first-token')
  })

  it('sends no Authorization header before a token is set', async () => {
    const seen = []
    axiosInstance.defaults.adapter = async (config) => {
      seen.push(config)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await axiosInstance.get('/owners/')

    expect(authHeader(seen[0])).toBeFalsy()
  })

  it('refreshes the token and replays the request after a 401', async () => {
    refreshToken.mockResolvedValue('fresh-token')

    const seen = []
    axiosInstance.defaults.adapter = async (config) => {
      seen.push(config)
      if (seen.length === 1) {
        return Promise.reject({ response: { status: 401 }, config })
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }
    }

    const response = await axiosInstance.get('/owners/')

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(seen).toHaveLength(2)
    expect(authHeader(seen[1])).toBe('Bearer fresh-token')
    expect(response.data).toEqual({ ok: true })
    expect(logout).not.toHaveBeenCalled()
  })

  it('logs out and rejects when the refresh fails', async () => {
    refreshToken.mockResolvedValue(null)
    axiosInstance.defaults.adapter = async (config) =>
      Promise.reject({ response: { status: 401 }, config })

    await expect(axiosInstance.get('/owners/')).rejects.toBeTruthy()

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('passes a non-401 failure straight through without refreshing', async () => {
    axiosInstance.defaults.adapter = async (config) =>
      Promise.reject({ response: { status: 500 }, config })

    await expect(axiosInstance.get('/owners/')).rejects.toBeTruthy()

    expect(refreshToken).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })
})
