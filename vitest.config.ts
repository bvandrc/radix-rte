import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // Resolves the `@/*` alias from `tsconfig.json`, so it's declared only there.
  resolve: { tsconfigPaths: true },
  test: {
    // A spy declared once for a `describe` starts each case empty, so a
    // `toHaveBeenCalledWith` cannot pass on a call from the case before it.
    clearMocks: true,
    // A `vi.spyOn` a case leaves in place would otherwise reach every case
    // after it in its file, the same as a stubbed global below.
    restoreMocks: true,
    // A stubbed global or env var a case forgets to undo would otherwise reach
    // every case after it in its file, which shares one page.
    unstubGlobals: true,
    unstubEnvs: true,
    // A real browser rather than a DOM emulation: an editor is selections and
    // typing, which happy-dom and jsdom only approximate. ProseMirror 1.43
    // reads selections on `selectionchange`, which happy-dom fires
    // synchronously, so the table and full-screen cases failed there.
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts?(x)'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
