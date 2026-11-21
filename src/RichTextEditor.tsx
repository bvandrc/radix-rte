/**
 * @fileoverview Rich text editor (@tiptap) with a basic formatting toolbar, and
 * optional full screen. Value is an HTML string, or null when empty.
 */

import type { MergeExclusive } from 'type-fest'

import {
  RteFullscreenAllowed,
  type RteFullscreenAllowedProps,
} from './RteFullscreenAllowed'
import { RteNoFullscreen, type RteNoFullscreenProps } from './RteNoFullscreen'

export type RichTextEditorProps = MergeExclusive<
  {
    /**
     * Whether to allow full screen: the toolbar's button for it, and the
     * dialog it opens. The editor itself is the same either way.
     * @default true
     */
    allowFullscreen?: true
  } & RteFullscreenAllowedProps,
  { allowFullscreen: false } & RteNoFullscreenProps
>

/**
 * The rich text editor, with or without full screen.
 *
 * Renders either `RteFullscreenAllowed` or `RteNoFullscreen`, based on the
 * `allowFullscreen` prop (`true` by default).
 *
 * NOTE: Changing `allowFullscreen` on a mounted editor remounts the editor.
 */
export const RichTextEditor = (props: RichTextEditorProps) =>
  // `allowFullscreen` rides along unused: `RteCore` reads only the props it
  // names.
  props.allowFullscreen === false ? (
    <RteNoFullscreen {...props} />
  ) : (
    <RteFullscreenAllowed {...props} />
  )
