/**
 * @fileoverview The rich text editor's paste handling for HTML that arrives
 * as plain text.
 */

import { type Editor, Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

import { NODE } from '../lib/constants'
import { isHtmlMarkup } from '../lib/html'

const PLUGIN_NAME = 'pasteHtmlSource'

const createPasteHtmlSourcePlugin = (editor: Editor) =>
  new Plugin({
    key: new PluginKey(PLUGIN_NAME),
    props: {
      handlePaste: (_view, event) => {
        if (editor.isActive(NODE.CODE_BLOCK)) return false

        // Keyed on `text/plain` alone, deliberately: copying a highlighted code
        // block puts the styled `<pre>` on `text/html` and the raw markup on
        // `text/plain`, so preferring the plain flavor is the whole point.
        // Deferring to `text/html` when both are present would paste the tags
        // back as text — the case this exists to fix.
        const text = event.clipboardData?.getData('text/plain')
        if (!text || !isHtmlMarkup(text)) return false

        editor.commands.insertContent(text, {
          parseOptions: { preserveWhitespace: false },
        })
        return true
      },
    },
  })

/**
 * Renders pasted HTML *source* as rich content — markup that arrived as text,
 * copied out of a code block, an email, a chat reply.
 *
 * To keep markup literal, paste into a code block, which this skips. Anything
 * the schema doesn't know is dropped by the parse.
 */
export const PasteHtmlSource = Extension.create({
  name: PLUGIN_NAME,
  addProseMirrorPlugins() {
    return [createPasteHtmlSourcePlugin(this.editor)]
  },
})
