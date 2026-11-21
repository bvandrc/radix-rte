// biome-ignore-all lint/performance/noBarrelFile: a package entry point is a
// barrel by definition -- it is what `exports` resolves to.

/**
 * @fileoverview The editor package's React-free helpers, safe to import
 * anywhere, a server included. Nothing under here may reach React, Tiptap, or
 * the editor itself.
 */

export { isEditorHtml, isHtmlMarkup, toEditorContent } from './html'
