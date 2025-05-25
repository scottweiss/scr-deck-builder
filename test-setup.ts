// Test setup file for Vitest
import { vi } from 'vitest'

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock browser-specific globals if needed
global.window = undefined as any
global.document = undefined as any

// Set up test environment
process.env.NODE_ENV = 'test'
