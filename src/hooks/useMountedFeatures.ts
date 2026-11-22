/** @fileoverview The editor's features, frozen at mount. */

import { useEffect, useState } from 'react'
import { pickBy } from 'es-toolkit'

import { type RteFeaturesArg, resolveFeatures } from '@/lib/features'

/**
 * The features the editor was created with, resolved once at mount.
 *
 * The extensions built from them can't be swapped on a live editor, so a later
 * change to `featureOverrides` is ignored, with a console warning.
 */
export const useMountedFeatures = (featureOverrides?: RteFeaturesArg) => {
  // Frozen, like the extensions built from it: a control shown for a feature
  // whose extension was never registered would throw on click.
  const [features] = useState(() => resolveFeatures(featureOverrides))

  // The effect is keyed on a string of the changed names rather than on the
  // props object, which a host usually builds fresh every render, so each
  // distinct change warns once. A changed feature can only have flipped, so
  // its name says it all.
  const ignored = Object.keys(
    pickBy(
      resolveFeatures(featureOverrides),
      (isOn, feature) => isOn !== features[feature]
    )
  ).join()
  useEffect(() => {
    if (!ignored) return
    console.warn(
      `@bvandrc/radix-rich-text-editor: \`features\` is read once, when the editor is created, so the change to ${ignored.replaceAll(',', ', ')} is ignored. Remount the editor (e.g. give it a new \`key\`) to apply it.`
    )
  }, [ignored])

  return features
}
