/**
 * @fileoverview Whether the rich text editor's toolbar is showing: while the
 * field has focus, and always in full screen.
 */

import { useEffect, useState } from 'react'
import { useAfterPress } from '@bvandrc/react-toolkit'
import { useEventListener } from 'usehooks-ts'

/** Radix marks its portaled menu with this, which is how focus lands there. */
const MENU_CONTENT_ATTR = 'data-radix-menu-content'

export type ToolbarVisibilityProps = {
  /** Reports whether the toolbar is showing: once on mount, and again each time that changes. */
  onToolbarVisibleChange?: (isVisible: boolean) => void
}

/**
 * Whether the toolbar is showing, and how its menus keep it open.
 *
 * It opens when focus enters `containerRef` and closes once focus moves to
 * another control -- straight away from the keyboard, and once the press has
 * finished from a pointer.
 */
export const useToolbarVisibility = ({
  containerRef,
  isFullscreen,
  onToolbarVisibleChange,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  isFullscreen: boolean
} & ToolbarVisibilityProps) => {
  const [isToolbarOpen, setIsToolbarOpen] = useState(false)
  const showToolbar = isToolbarOpen || isFullscreen

  useEffect(() => {
    onToolbarVisibleChange?.(showToolbar)
  }, [showToolbar, onToolbarVisibleChange])

  // usehooks-ts types its element ref as React 18's `RefObject<T>`, which left
  // null implicit; React 19's `useRef(null)` spells it out, and its overloads
  // reject that.
  const listenerRef = containerRef as React.RefObject<HTMLDivElement>

  // Focus leaves as a press goes down, and closing the toolbar then would move
  // everything below it out from under the press's click -- a tap on the next
  // field down would miss. So that close waits for the press to finish; one
  // from the keyboard, with no press, happens straight away.
  const afterPress = useAfterPress()

  useEventListener(
    'focusin',
    () => {
      afterPress.cancel()
      setIsToolbarOpen(true)
    },
    listenerRef
  )

  // Hide the toolbar once focus has moved to another control. Focus sitting on
  // the table menu — or nowhere, as it does mid-click — means the user is still
  // working in this field, so the toolbar stays put rather than blinking.
  useEventListener(
    'focusout',
    ({ relatedTarget: next }) => {
      if (
        !(next instanceof Element) ||
        next.closest(`[${MENU_CONTENT_ATTR}]`) ||
        containerRef.current?.contains(next)
      ) {
        return
      }
      afterPress.run(() => setIsToolbarOpen(false))
    },
    listenerRef
  )

  return { showToolbar, setIsToolbarOpen }
}
