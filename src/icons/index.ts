// biome-ignore-all lint/performance/noBarrelFile: a package entry point is a
// barrel by definition -- it is what `exports` resolves to.

/**
 * @fileoverview The `/icons` entry point: the table menu's badged icons, and
 * the builder that draws them for a host's own.
 */

export {
  type BadgedIconOptions,
  buildBadgedIcon,
  LUCIDE_VIEWBOX_SIZE,
} from './icon-builders'
export {
  CutColumnsIcon,
  CutRowsIcon,
  DeleteColumnsIcon,
  DeleteRowsIcon,
  PasteAboveIcon,
  PasteBelowIcon,
  PasteLeftIcon,
  PasteRightIcon,
} from './table-icons'
