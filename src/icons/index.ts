// biome-ignore-all lint/performance/noBarrelFile: a package entry point is a
// barrel by definition -- it is what `exports` resolves to.

/**
 * @fileoverview The `/icons` entry point: the table menu's badged icons, and
 * the builder that draws them for a host's own. Everything both files export
 * is public, so a new export from either ships with the next release.
 */

export * from './icon-builders'
export * from './table-icons'
