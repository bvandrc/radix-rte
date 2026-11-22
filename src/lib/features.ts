/**
 * @fileoverview The editor's optional formatting features, each a toolbar
 * control and the Tiptap extensions behind it.
 */

import type { StarterKitOptions } from '@tiptap/starter-kit'
import { mapValues } from 'es-toolkit'

/** Every optional feature, each on by default. */
const FEATURE_DEFAULTS = {
  bold: true,
  italic: true,
  strike: true,
  bulletList: true,
  orderedList: true,
  checklist: true,
  codeBlock: true,
  table: true,
} satisfies Record<string, true>

export type RteFeature = keyof typeof FEATURE_DEFAULTS

/** The features StarterKit carries, each named for its extension's option. */
export const STARTER_KIT_FEATURES = [
  'bold',
  'italic',
  'strike',
  'bulletList',
  'orderedList',
  'codeBlock',
] as const satisfies readonly (RteFeature & keyof StarterKitOptions)[]

/** The features to turn off/on. */
export type RteFeaturesResolved = Record<RteFeature, boolean>

/** Which features are on. Any left out are `true`. */
export type RteFeaturesArg = Partial<RteFeaturesResolved>

/** Whether each feature is on, with any the host left out on. */
export const resolveFeatures = (
  features: RteFeaturesArg = {}
): RteFeaturesResolved =>
  mapValues(FEATURE_DEFAULTS, (_, feature) => features[feature] !== false)
