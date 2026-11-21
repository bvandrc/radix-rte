/** @fileoverview Constants shared across the rich text editor's modules. */

// *****************************************************************************
// TipTap Schema Names
//
// The @tiptap schema names that no direct dependency exports: they come only
// through `@tiptap/starter-kit`, which doesn't re-export the extensions
// themselves. Every other name is read off its extension's `.name`
// (`Table.name`, `TaskList.name`, ...).
// *****************************************************************************

/** Node names, as `editor.isActive` uses them. */
export const NODE = {
  CODE_BLOCK: 'codeBlock',
} as const

/** Mark names, as `editor.isActive` uses them. */
export const MARK = {
  BOLD: 'bold',
  ITALIC: 'italic',
  STRIKE: 'strike',
} as const
