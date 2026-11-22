// biome-ignore-all lint/performance/noBarrelFile: a package entry point is a
// barrel by definition -- it is what `exports` resolves to.

/**
 * @fileoverview The `/utils` entry point: the editor package's React-free
 * helpers, safe to import anywhere, a server included. Nothing this
 * re-exports may reach React, Tiptap, or the editor itself.
 */

export { isEditorHtml, isHtmlMarkup, toEditorContent } from './lib/html'
