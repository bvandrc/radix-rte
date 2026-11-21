/**
 * @fileoverview Helpers for the HTML string the editor reads and writes.
 * Exported so every reader of a stored value agrees on what counts as
 * editor-produced HTML versus a legacy plain-text one. `/utils` ships it for
 * servers too, so it may reach nothing of React, Tiptap, or the editor.
 */

import { escape as escapeHtml } from 'es-toolkit'

/**
 * Whether a plain-text value is HTML source — markup copied as text, from a
 * code block or an email say — rather than prose that happens to contain "<".
 * A yes only picks markup over text; the schema decides what survives the parse.
 */
export const isHtmlMarkup = (value: string) => {
  const trimmed = value.trim()
  // Both stay anchored, so a long value that never matches can't backtrack.
  return (
    // Opens on a tag — "I used a <table> once" and "<3 you" don't.
    /^<[a-z][a-z0-9]*\b[^>]*>/i.test(trimmed) &&
    // Closes on one — "<ul> means unordered list" and "<p>unclosed" don't.
    /<\/[a-z][a-z0-9]*\s*>$/i.test(trimmed)
  )
}

/**
 * Whether a value is HTML this editor wrote, as opposed to a legacy plain-text
 * description or an import from an app that never had rich text.
 *
 * Narrower than `isHtmlMarkup` on purpose, and the allowlist is the reason:
 * another app's plaintext note of "<b>see below</b>" is markup by that
 * function's standard, and treating it as HTML would silently stop escaping
 * it. Being stricter, this can only ever send a value the *safe* way — to
 * being escaped as text.
 */
export const isEditorHtml = (value: string) =>
  isHtmlMarkup(value) &&
  // The block tags the editor can start a document with — nothing else.
  /^<(p|ul|ol|pre|table)[\s>]/.test(value.trimStart())

/** Values saved before rich text existed are plain text; convert so newlines survive. */
export const toEditorContent = (value: string | null) => {
  if (!value) return ''
  if (isEditorHtml(value)) return value
  return value
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('')
}
