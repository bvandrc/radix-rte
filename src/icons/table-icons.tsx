/**
 * @fileoverview The table menu's badged icons, for the actions Lucide has none
 * of.
 */

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Clipboard,
  Columns3,
  Rows3,
  Scissors,
  X,
} from 'lucide-react'

import {
  type BadgedIconOptions,
  buildBadgedIcon,
  LUCIDE_VIEWBOX_SIZE,
} from './icon-builders'

const CORNER_RED_X_BADGE_PROPS = {
  // `X` pads its glyph more than most, so it takes a smaller box to sit as
  // close to the corner.
  badgeSize: LUCIDE_VIEWBOX_SIZE / 2,
  badgeProps: { className: 'text-radix-rte-destructive' },
} satisfies Partial<BadgedIconOptions>

/** Lucide's `Rows3`, badged with a red X. */
export const DeleteRowsIcon = buildBadgedIcon(Rows3, X, {
  ...CORNER_RED_X_BADGE_PROPS,
  displayName: 'DeleteRowsIcon',
})

/** Lucide's `Columns3`, badged with a red X. */
export const DeleteColumnsIcon = buildBadgedIcon(Columns3, X, {
  ...CORNER_RED_X_BADGE_PROPS,
  displayName: 'DeleteColumnsIcon',
})

/** Lucide's `Rows3`, badged with scissors. */
export const CutRowsIcon = buildBadgedIcon(Rows3, Scissors, {
  displayName: 'CutRowsIcon',
})

/** Lucide's `Columns3`, badged with scissors. */
export const CutColumnsIcon = buildBadgedIcon(Columns3, Scissors, {
  displayName: 'CutColumnsIcon',
})

/** Lucide's `Clipboard`, badged with an up arrow. */
export const PasteAboveIcon = buildBadgedIcon(Clipboard, ArrowUp, {
  displayName: 'PasteAboveIcon',
})

/** Lucide's `Clipboard`, badged with a down arrow. */
export const PasteBelowIcon = buildBadgedIcon(Clipboard, ArrowDown, {
  displayName: 'PasteBelowIcon',
})

/** Lucide's `Clipboard`, badged with a left arrow. */
export const PasteLeftIcon = buildBadgedIcon(Clipboard, ArrowLeft, {
  displayName: 'PasteLeftIcon',
})

/** Lucide's `Clipboard`, badged with a right arrow. */
export const PasteRightIcon = buildBadgedIcon(Clipboard, ArrowRight, {
  displayName: 'PasteRightIcon',
})
