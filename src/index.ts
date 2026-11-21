// biome-ignore-all lint/performance/noBarrelFile: a package entry point is a
// barrel by definition -- it is what `exports` resolves to.

/** @fileoverview The rich text editor's public surface. */

export type {
  RteBaseComponents,
  RteFullscreenComponents,
} from './lib/components'
export type { RteFeature, RteFeaturesArg as RteFeatures } from './lib/features'
export {
  ENTER_FULLSCREEN_BTN_PROPS,
  EXIT_FULLSCREEN_BTN_PROPS,
} from './lib/fullscreen-button'
export {
  RichTextEditor,
  type RichTextEditorProps,
} from './RichTextEditor'
export {
  RteFullscreenAllowed,
  type RteFullscreenAllowedProps,
} from './RteFullscreenAllowed'
export { RteNoFullscreen, type RteNoFullscreenProps } from './RteNoFullscreen'
