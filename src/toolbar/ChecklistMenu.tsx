/**
 * @fileoverview The rich text editor toolbar's checklist menu.
 *
 * The extension it drives is in `extensions/checklist-auto-delete`.
 */

import { useRef } from 'react'
import { useTouchKeepsFocus } from '@bvandrc/react-toolkit'
import { useEditorState } from '@tiptap/react'
import { ListTodo, Trash2 } from 'lucide-react'

import { ChecklistWithAutoDelete } from '../extensions/checklist-auto-delete'
import {
  ACTIVE_BUTTON_CLASSES,
  ToolbarButton,
  type ToolbarMenuProps,
} from './ToolbarButton'

/**
 * The toolbar's checklist button, and the menu it opens inside a checklist.
 *
 * Outside a checklist, tapping it inserts one. Inside one, tapping it opens a
 * menu — same interaction as `TableMenu` — with the auto-delete option and a
 * way to remove the checklist.
 */
export const ChecklistMenu = ({
  editor,
  containerRef,
  onToolbarOpenChange,
  components: {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  },
}: ToolbarMenuProps) => {
  const isInList = useEditorState({
    editor,
    selector: ({ editor: e }) => e.isActive(ChecklistWithAutoDelete.name),
  })
  const autoDelete = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      Boolean(e.getAttributes(ChecklistWithAutoDelete.name).autoDelete),
  })

  const wasDismissedFromElsewhere = useRef(false)
  const { triggerProps, contentProps } = useTouchKeepsFocus()

  const chain = () => editor.chain().focus()

  if (!isInList) {
    return (
      <ToolbarButton
        label="Checklist"
        data-testid="radix-rte-checklist"
        onClick={() => chain().toggleTaskList().run()}>
        <ListTodo />
      </ToolbarButton>
    )
  }

  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(isOpen) => isOpen && onToolbarOpenChange(true)}>
      <DropdownMenuTrigger asChild {...triggerProps}>
        <ToolbarButton
          label="Checklist options"
          data-testid="radix-rte-checklist"
          className={ACTIVE_BUTTON_CLASSES}>
          <ListTodo />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        {...contentProps}
        align="start"
        data-testid="radix-rte-checklist-menu"
        onInteractOutside={(e) => {
          const target = e.detail.originalEvent.target
          wasDismissedFromElsewhere.current = !(
            target instanceof Node && containerRef.current?.contains(target)
          )
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          const keepEditing = !wasDismissedFromElsewhere.current
          if (keepEditing) editor.commands.focus()
          onToolbarOpenChange(keepEditing)
          wasDismissedFromElsewhere.current = false
        }}>
        <DropdownMenuCheckboxItem
          checked={autoDelete}
          data-testid="radix-rte-checklist-auto-delete"
          onCheckedChange={(checked) =>
            chain()
              .updateAttributes(ChecklistWithAutoDelete.name, {
                autoDelete: checked,
              })
              .run()
          }>
          Delete item when checked
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          label="Remove checklist"
          icon={Trash2}
          data-testid="radix-rte-checklist-remove"
          variant="destructive"
          onSelect={() => chain().toggleTaskList().run()}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
