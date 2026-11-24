/**
 * @fileoverview Runs before every test file.
 */

// Registers the matchers on `expect`, so every test has `toBeDisabled`,
// `toBeInTheDocument`, and the rest without importing them.
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'

// Each test file gets a page of its own, but its cases share it, so whatever
// one case leaves behind reaches every case after it in the file.
afterEach(() => {
  cleanup()
  // Radix portals mount on `body`, and a dialog's scroll lock is left on it.
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.body.removeAttribute('data-scroll-locked')
  localStorage.clear()
  vi.useRealTimers()
})
