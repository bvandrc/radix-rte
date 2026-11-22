/**
 * @fileoverview The rich text editor with full screen: a toolbar button that
 * moves it into a full-screen dialog, and back.
 */

import { useRef } from 'react'
import { useMaybeControlled } from '@bvandrc/react-toolkit'
import type { EmptyObject, MergeExclusive } from 'type-fest'

import { cn } from './lib/cn'
import type {
  RteBaseComponents,
  RteFullscreenComponents,
} from './lib/components'
import { ENTER_FULLSCREEN_BTN_PROPS } from './lib/fullscreen-button'
import { type RteCommonProps, RteCore } from './RteCore'
import {
  RteFullscreenDialog,
  type RteFullscreenDialogProps,
} from './RteFullscreenDialog'
import { ToolbarButton } from './toolbar/ToolbarButton'

export type RteFullscreenAllowedProps = RteCommonProps & {
  /** The host's own parts the editor renders its frame, toolbar menus, and full-screen dialog with. */
  components: RteBaseComponents & RteFullscreenComponents
} & Pick<RteFullscreenDialogProps, 'onSave'> &
  MergeExclusive<
    {
      /** Controls full screen from outside, with `onFullscreenChange`. Omit both to let the editor own it. */
      isFullscreen: boolean
      onFullscreenChange: (isFullscreen: boolean) => void
    },
    EmptyObject
  >

/** The rich text editor, with a toolbar button that opens it full screen. */
export const RteFullscreenAllowed = ({
  isFullscreen: controlledIsFullscreen,
  onFullscreenChange: controlledOnFullscreenChange,
  onSave,
  ...props
}: RteFullscreenAllowedProps) => {
  const [isFullscreen, onFullscreenChange] = useMaybeControlled(
    controlledIsFullscreen,
    controlledOnFullscreenChange,
    false
  )
  const fullscreenRef = useRef<HTMLDivElement | null>(null)

  return (
    <RteCore
      {...props}
      fullscreenRef={isFullscreen ? fullscreenRef : undefined}
      toolbarPinnedRight={
        // No `isActive`, since full screen isn't formatting. Hidden while full
        // screen, where the dialog's header has the one way out.
        !isFullscreen && (
          <ToolbarButton
            {...ENTER_FULLSCREEN_BTN_PROPS}
            label={ENTER_FULLSCREEN_BTN_PROPS['aria-label']}
            data-testid="radix-rte-fullscreen"
            onClick={() => onFullscreenChange(true)}
          />
        )
      }
      // One editor instance, rendered either inline or inside the full-screen
      // dialog. `EditorContent` hands the editor's DOM back and forth on
      // unmount/mount, so the document, history, and undo stack all survive
      // the move.
      renderContent={({ editor, label, toolbarAndInput }) => (
        <>
          {isFullscreen ? (
            // Holds the field's place in the form while its content is away,
            // so nothing shifts underneath the dialog.
            <div
              aria-hidden
              className={cn('px-3 py-2', props.contentClassName)}
            />
          ) : (
            toolbarAndInput
          )}
          <RteFullscreenDialog
            editor={editor}
            label={label}
            isOpen={isFullscreen}
            onOpenChange={onFullscreenChange}
            contentRef={fullscreenRef}
            components={props.components}
            onSave={onSave}>
            {isFullscreen && toolbarAndInput}
          </RteFullscreenDialog>
        </>
      )}
    />
  )
}
