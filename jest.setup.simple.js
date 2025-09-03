import '@testing-library/jest-dom'

// Suppress console warnings during tests
const originalConsole = console

global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
}
