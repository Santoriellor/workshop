import '@testing-library/jest-dom/vitest'
import { TextEncoder, TextDecoder } from 'util'

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder
}

globalThis.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))
