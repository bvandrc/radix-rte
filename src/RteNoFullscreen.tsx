/**
 * @fileoverview The rich text editor without full screen, importable on its
 * own so none of the full-screen code reaches a host's bundle.
 */

import type { RteBaseComponents } from './lib/components'
import { type RteCommonProps, RteCore } from './RteCore'

export type RteNoFullscreenProps = RteCommonProps & {
  /** The host's own parts the editor renders its frame and toolbar menus with. */
  components: RteBaseComponents
}

/** The rich text editor, with no full-screen button or dialog. */
export const RteNoFullscreen = (props: RteNoFullscreenProps) => (
  <RteCore {...props} />
)
