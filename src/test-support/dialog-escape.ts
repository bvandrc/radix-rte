/**
 * @fileoverview Standing in for a dialog's Escape handling, for a component
 * under test that has to cope with it without rendering the dialog itself.
 */

/**
 * Takes Escape the way a host app's dialog can: on the document, ahead of
 * whatever has focus, blurring it and marking the key handled.
 *
 * Call it inside a test; the listener comes off when that test finishes.
 */
export const mockDialogEscape = () => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    event.preventDefault()
  }
  document.addEventListener('keydown', handleEscape, true)
  onTestFinished(() =>
    document.removeEventListener('keydown', handleEscape, true)
  )
}
