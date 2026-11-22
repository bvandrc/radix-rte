/**
 * @fileoverview What every variant of the rich text editor is built on: the
 * editor, its frame, and its toolbar above its text.
 */

import { useRef } from 'react'
import { type Editor, EditorContent } from '@tiptap/react'

import { type EditorFieldProps, useEditor } from './hooks/useEditor'
import { useMountedFeatures } from './hooks/useMountedFeatures'
import {
  type ToolbarVisibilityProps,
  useToolbarVisibility,
} from './hooks/useToolbarVisibility'
import { cn } from './lib/cn'
import type { RteBaseComponents } from './lib/components'
import type { RteFeaturesArg } from './lib/features'
import { Toolbar, type ToolbarProps } from './toolbar/Toolbar'

/** The props every variant of the editor takes, whatever its `components`. */
export type RteCommonProps = {
  /**
   * Classes for the whole field, toolbar included. A `max-h-*` here caps the
   * field, and the text scrolls inside whatever room the toolbar leaves.
   */
  className?: string
  'data-testid'?: string
  /**
   * Which formatting features are on. Each is `true` by default.
   *
   * A feature turned off loses both its toolbar control and the Tiptap
   * extensions behind it, so content that uses it, pasted or passed in as
   * `value`, is dropped.
   *
   * Read once, when the editor is created.
   */
  features?: RteFeaturesArg
} & EditorFieldProps &
  ToolbarVisibilityProps

export type RteCoreProps = RteCommonProps & {
  /** The host's own parts the editor renders its frame and toolbar menus with. */
  components: RteBaseComponents
  /** Pinned at the toolbar's right end, past its scrolling row of buttons. */
  toolbarPinnedRight?: ToolbarProps['pinned']
  /**
   * The element the toolbar and text are in while full screen.
   *
   * Set, it keeps the toolbar showing and stretches the text to fill it. Omit
   * while not full screen.
   */
  fullscreenRef?: React.RefObject<HTMLDivElement | null>
  /**
   * Renders what's inside the frame, given `toolbarAndInput` to place.
   *
   * Omit to render `toolbarAndInput` as it is.
   */
  renderContent?: (args: {
    editor: Editor
    label: string
    toolbarAndInput: React.ReactNode
  }) => React.ReactNode
}

/** The editor in its frame, with its toolbar above its text. */
export const RteCore = ({
  components,
  value,
  onChange,
  placeholder,
  label = 'Editor',
  onToolbarVisibleChange,
  className,
  contentClassName,
  'data-testid': dataTestId,
  features: featureOverrides,
  toolbarPinnedRight,
  fullscreenRef,
  renderContent,
}: RteCoreProps) => {
  const features = useMountedFeatures(featureOverrides)
  const editor = useEditor({
    value,
    onChange,
    placeholder,
    label,
    contentClassName,
    features,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const isFullscreen = fullscreenRef !== undefined
  const { showToolbar, setIsToolbarOpen } = useToolbarVisibility({
    containerRef,
    isFullscreen,
    onToolbarVisibleChange,
  })

  if (!editor) return null

  const toolbarAndInput = (
    <>
      <div
        className={cn(
          // `shrink-0` so a capped field takes its room from the text, not
          // the toolbar.
          'shrink-0 overflow-hidden',
          // Only opening animates. Closing comes as focus leaves, and while it
          // animated, the scroll box around the editor scrolled every frame to
          // keep what's below in place, which closed any tooltip focus had
          // just opened in that box.
          showToolbar ? 'max-h-14 transition-all duration-150' : 'max-h-0'
        )}>
        <Toolbar
          editor={editor}
          containerRef={fullscreenRef ?? containerRef}
          onToolbarOpenChange={setIsToolbarOpen}
          components={components}
          isOpen={showToolbar}
          features={features}
          pinned={toolbarPinnedRight}
        />
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          'min-h-0 overflow-y-auto',
          isFullscreen && 'flex-1 [&>.tiptap]:min-h-full'
        )}
      />
    </>
  )

  const { Field } = components

  return (
    <Field
      ref={containerRef}
      data-testid={dataTestId}
      className={cn('flex flex-col', className)}>
      {renderContent
        ? renderContent({ editor, label, toolbarAndInput })
        : toolbarAndInput}
    </Field>
  )
}
