/**
 * @fileoverview The rich text editor's checklist extensions.
 *
 * Adds the per-list auto-delete option and removes checked items from lists
 * that have it on. The toggle for it is in `toolbar/ChecklistMenu`.
 */

import { Extension } from '@tiptap/core'
import {
  TaskList as Checklist,
  TaskItem as ChecklistItem,
} from '@tiptap/extension-list'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const PLUGIN_NAME = 'autoDeleteCheckedItems'

/** Persists a checklist's `autoDelete` flag on its `<ul>`. */
const AUTO_DELETE_ATTR = 'data-auto-delete'

/**
 * Adds a per-list `autoDelete` flag, persisted as `data-auto-delete` on the
 * `<ul>`.
 */
export const ChecklistWithAutoDelete = Checklist.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      autoDelete: {
        default: false,
        // `parseHTML`/`renderHTML` are explicit because TipTap's default would
        // render a bare `autoDelete="..."` attribute (off the `data-*`
        // convention `data-checked`/`data-type` use) on every list, even when
        // off.
        parseHTML: (element) =>
          element.getAttribute(AUTO_DELETE_ATTR) === 'true',
        renderHTML: (attributes) =>
          attributes.autoDelete ? { [AUTO_DELETE_ATTR]: 'true' } : {},
      },
    }
  },
})

/**
 * Deletes every checked item in a checklist with `autoDelete` on, and the
 * checklist itself once its last item goes.
 */
const autoDeleteCheckedItemsPlugin = new Plugin({
  key: new PluginKey(PLUGIN_NAME),
  // An `appendTransaction` (rather than a `ChecklistItem` node view override),
  // so it sees every way a checkbox can get checked.
  appendTransaction: (transactions, _oldState, newState) => {
    if (!transactions.some((transaction) => transaction.docChanged)) {
      return null
    }

    const ranges: { from: number; to: number }[] = []
    newState.doc.descendants((node, pos, parent) => {
      if (
        node.type.name !== ChecklistItem.name ||
        !node.attrs.checked ||
        parent?.type.name !== Checklist.name ||
        !parent.attrs.autoDelete
      ) {
        return
      }
      if (parent.childCount !== 1) {
        ranges.push({ from: pos, to: pos + node.nodeSize })
      } else {
        // The only item left: drop the whole (now-empty) checklist rather than
        // leaving a list with zero items, which the schema (`taskItem+`)
        // doesn't allow. Resolving at `pos` (the taskItem's own start) lands
        // the resolved position's parent on the taskList itself, so its depth
        // gives the list's range directly — no need to walk up from the
        // taskItem.
        const $pos = newState.doc.resolve(pos)
        ranges.push({
          from: $pos.before($pos.depth),
          to: $pos.after($pos.depth),
        })
      }
    })
    if (ranges.length === 0) return null

    const tr = newState.tr
    // Delete from the end backward so earlier ranges' positions stay valid.
    for (const { from, to } of ranges.reverse()) tr.delete(from, to)
    return tr
  },
})

/**
 * Removes a checklist item as soon as it's checked, for any checklist with
 * `autoDelete` on — however it got checked: clicking it, the `[x]` input rule,
 * or a keyboard shortcut.
 */
export const AutoDeleteCheckedItems = Extension.create({
  name: PLUGIN_NAME,
  addProseMirrorPlugins() {
    return [autoDeleteCheckedItemsPlugin]
  },
})
