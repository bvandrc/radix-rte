import {
  mockMobile,
  mockVisualViewport,
} from '@bvandrc/react-toolkit/test-support'
import { screen, waitFor } from '@testing-library/react'

import { SELECTORS } from '@/test-support/selectors'
import { renderEditor } from './__helpers__'

const { FULLSCREEN_DIALOG } = SELECTORS

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// Full viewport-pinning behavior itself is covered by `useVisualViewportPin`'s own tests.

it('pins the portalled fullscreen dialog to the visual viewport on mobile', async () => {
  mockMobile(true)
  mockVisualViewport({ offsetTop: 48, height: 800 })

  renderEditor({
    label: 'Description',
    isFullscreen: true,
    onFullscreenChange: vi.fn(),
  })

  const dialog = await screen.findByTestId(FULLSCREEN_DIALOG)
  // The pin's own inline style, since the computed `transform` reads back as a
  // matrix rather than as the `translateY` that set it.
  await waitFor(() =>
    expect(dialog.style).toMatchObject({
      transform: 'translateY(48px)',
      height: '800px',
    })
  )
})

it('leaves the fullscreen dialog unpinned on desktop', async () => {
  mockMobile(false)
  mockVisualViewport({ offsetTop: 48, height: 800 })

  renderEditor({
    label: 'Description',
    isFullscreen: true,
    onFullscreenChange: vi.fn(),
  })

  const dialog = await screen.findByTestId(FULLSCREEN_DIALOG)
  expect(dialog.style.transform).toBe('')
  expect(dialog.style.height).toBe('')
})
