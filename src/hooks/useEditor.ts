/**
 * @fileoverview The rich text editor's Tiptap editor, kept in step with its
 * `value`.
 */

import { useEffect, useRef } from 'react'
import { TaskItem as ChecklistItem } from '@tiptap/extension-list'
import { Table, TableKit } from '@tiptap/extension-table'
import { Placeholder } from '@tiptap/extensions'
import { type Editor, useEditor as useTiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { mapValues, pick } from 'es-toolkit'
import type { SetRequired } from 'type-fest'

import {
  AutoDeleteCheckedItems,
  ChecklistWithAutoDelete,
} from '@/extensions/checklist-auto-delete'
import { PasteHtmlSource } from '@/extensions/paste-html-source'
import { TableCutPaste } from '@/extensions/table-cut-paste'
import { cn } from '@/lib/cn'
import { type RteFeaturesResolved, STARTER_KIT_FEATURES } from '@/lib/features'
import { toEditorContent } from '@/lib/html'

/**
 * Whether the editor is empty.
 *
 * NOTE: A table counts as content, even when blank.
 */
const isEditorEmpty = (editor: Editor) =>
  // `isEmpty` only counts text, so the table check has to be added.
  editor.isEmpty && !editor.$node(Table.name)

/** What the editor shows and reports, and how it's named and styled. */
export type EditorFieldProps = {
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  /** Names the field, both to assistive tech and in the full-screen editor's header. */
  label?: string
  contentClassName?: string
}

/**
 * The Tiptap editor behind the rich text editor, with its extensions.
 *
 * Reports each edit through `onChange` as HTML, or null when empty, and
 * applies a `value` that changes from outside (e.g. a form reset) without
 * undoing typing in progress. `null` until Tiptap has built it.
 */
export const useEditor = ({
  value,
  onChange,
  placeholder,
  label,
  contentClassName,
  features,
}: SetRequired<EditorFieldProps, 'label'> & {
  /** Which features are on. Read once, when the editor is created. */
  features: RteFeaturesResolved
}) => {
  // What `onUpdate` has reported that `value` hasn't echoed back yet, oldest
  // first -- see the sync effect below.
  const unechoedRef = useRef<(string | null)[]>([])

  const editor = useTiptapEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        // A feature that's on keeps StarterKit's own default for its extension.
        ...mapValues(pick(features, STARTER_KIT_FEATURES), (isOn) =>
          isOn ? undefined : false
        ),
      }),
      ...(features.checklist
        ? [
            ChecklistWithAutoDelete,
            ChecklistItem.configure({ nested: true }),
            AutoDeleteCheckedItems,
          ]
        : []),
      PasteHtmlSource,
      ...(features.table
        ? [TableKit.configure({ table: { resizable: true } }), TableCutPaste]
        : []),
      Placeholder.configure({ placeholder }),
    ],
    content: toEditorContent(value),
    onUpdate: ({ editor: e }) => {
      const html = isEditorEmpty(e) ? null : e.getHTML()
      unechoedRef.current.push(html)
      onChange(html)
    },
    editorProps: {
      attributes: {
        // Tiptap gives the editable element `role="textbox"`, which needs a name.
        'aria-label': label,
        // What `styles.css` scopes its content styles to, so another Tiptap
        // editor on the page keeps its own.
        'data-slot': 'radix-rte-content',
        class: cn(
          'prose prose-sm text-base md:text-sm',
          'max-w-none px-3 py-2',
          'focus:outline-none',
          '[&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_pre]:my-1',
          contentClassName
        ),
      },
    },
  })

  // Apply external value changes (e.g. form reset) without clobbering in-progress typing.
  useEffect(() => {
    // Tiptap destroys the editor it built in render when the commit lands more
    // than 1ms later, as on a slow phone, then swaps in a new one -- this run
    // still holds the destroyed one, and the next run gets the replacement.
    // https://github.com/ueberdosis/tiptap/issues/8400
    if (!editor || editor.isDestroyed) return
    // A `value` this editor reported itself is an echo, not an external
    // change, even once typing has moved past it: a render can commit the
    // echo of one keystroke after the next has landed, and applying it would
    // undo that keystroke.
    const unechoed = unechoedRef.current
    const echoAt = unechoed.indexOf(value)
    if (echoAt !== -1) {
      unechoed.splice(0, echoAt + 1)
      return
    }
    unechoed.length = 0
    const next = toEditorContent(value)
    const current = isEditorEmpty(editor) ? '' : editor.getHTML()
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  return editor
}
