/**
 * @fileoverview The rich text editor toolbar's table menu.
 *
 * The extension it drives is in `extensions/table-cut-paste`.
 */

import { useRef } from 'react'
import {
  useMakeRoomForPopover,
  useTouchKeepsFocus,
} from '@bvandrc/react-toolkit'
import { Table } from '@tiptap/extension-table'
import { useEditorState } from '@tiptap/react'
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Grid2x2Plus,
  type LucideIcon,
  PanelTop,
  TableCellsMerge,
  TableCellsSplit,
  TableConfig,
  Table as TableIcon,
  Trash2,
} from 'lucide-react'

import {
  getPendingTableCut,
  type TableAxis,
  type TablePasteSide,
} from '../extensions/table-cut-paste'
import {
  CutColumnsIcon,
  CutRowsIcon,
  DeleteColumnsIcon,
  DeleteRowsIcon,
  PasteAboveIcon,
  PasteBelowIcon,
  PasteLeftIcon,
  PasteRightIcon,
} from '../icons'
import { cn } from '../lib/cn'
import {
  ACTIVE_BUTTON_CLASSES,
  ToolbarButton,
  type ToolbarMenuProps,
} from './ToolbarButton'

const PASTE_ITEMS = {
  row: {
    before: { label: 'Paste row above', icon: PasteAboveIcon },
    after: { label: 'Paste row below', icon: PasteBelowIcon },
  },
  column: {
    before: { label: 'Paste column left', icon: PasteLeftIcon },
    after: { label: 'Paste column right', icon: PasteRightIcon },
  },
} satisfies Record<
  TableAxis,
  Record<TablePasteSide, { label: string; icon: LucideIcon }>
>

/** Table actions, in a menu so the toolbar stays a single row. */
export const TableMenu = ({
  editor,
  containerRef,
  onToolbarOpenChange,
  components: {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  },
}: ToolbarMenuProps) => {
  const { isInTable, pendingCut, canCut, canPaste, canMerge, canSplit } =
    useEditorState({
      editor,
      // Dry runs: each is refused where it would split merged cells, and a paste
      // once the caret is in some other table.
      selector: ({ editor: e }) => ({
        isInTable: e.isActive(Table.name),
        pendingCut: getPendingTableCut(e.state)?.axis ?? null,
        canCut: {
          row: e.can().cutTableAxis('row'),
          column: e.can().cutTableAxis('column'),
        } satisfies Record<TableAxis, boolean>,
        canPaste: {
          before: e.can().pasteTableAxis('before'),
          after: e.can().pasteTableAxis('after'),
        } satisfies Record<TablePasteSide, boolean>,
        // Merging takes a selection of several cells; splitting, a merged one.
        canMerge: e.can().mergeCells(),
        canSplit: e.can().splitCell(),
      }),
    })

  // Dismissing by clicking something outside the editor (another field, say)
  // means the user has moved on — taking focus back would fight them for it.
  const wasDismissedFromElsewhere = useRef(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { triggerProps, contentProps } = useTouchKeepsFocus()
  // A long menu (e.g. the in-table one, on a short screen) can be taller than
  // the space both above and below a toolbar midway down the form, so the
  // editor scrolls up to the top of the form to leave it the space below.
  const makeRoomForMenu = useMakeRoomForPopover(triggerRef, {
    scrollTarget: containerRef,
    // `DropdownMenuContent`'s 4px gap from the trigger, and its 1px border
    // top and bottom.
    extraHeightPx: 6,
  })

  const chain = () => editor.chain().focus()
  const TriggerIcon = isInTable ? TableConfig : TableIcon

  return (
    // Non-modal: a modal menu makes the rest of the dialog inert, so clicking
    // the trigger again — or into the editor — would hit the dialog overlay
    // instead, dismissing the menu and dropping focus.
    //
    // Closing is reported from `onCloseAutoFocus` instead of here: the menu
    // closes on pointer *down* but focus only comes back on release, and
    // reporting it early collapses the toolbar for however long the click is
    // held.
    <DropdownMenu
      modal={false}
      onOpenChange={(isOpen) => isOpen && onToolbarOpenChange(true)}>
      <DropdownMenuTrigger asChild ref={triggerRef} {...triggerProps}>
        {/* No `isActive`: this opens a menu rather than toggling formatting,
            so it shouldn't report itself as pressed. */}
        <ToolbarButton
          label={isInTable ? 'Table options' : 'Table'}
          data-testid="radix-rte-table"
          className={cn(isInTable && ACTIVE_BUTTON_CLASSES)}>
          <TriggerIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        {...contentProps}
        ref={makeRoomForMenu}
        align="start"
        data-testid="radix-rte-table-menu"
        onInteractOutside={(e) => {
          const target = e.detail.originalEvent.target
          wasDismissedFromElsewhere.current = !(
            target instanceof Node && containerRef.current?.contains(target)
          )
        }}
        // Put focus back in the editor rather than on the trigger, so the
        // toolbar stays open — on touch devices the command's own `focus()`
        // doesn't survive the menu closing.
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          const keepEditing = !wasDismissedFromElsewhere.current
          if (keepEditing) editor.commands.focus()
          onToolbarOpenChange(keepEditing)
          wasDismissedFromElsewhere.current = false
        }}>
        {isInTable ? (
          <>
            <DropdownMenuItem
              label="Insert row above"
              icon={ArrowUpToLine}
              data-testid="radix-rte-table-add-row-before"
              onSelect={() => chain().addRowBefore().run()}
            />
            <DropdownMenuItem
              label="Insert row below"
              icon={ArrowDownToLine}
              data-testid="radix-rte-table-add-row-after"
              onSelect={() => chain().addRowAfter().run()}
            />
            <DropdownMenuItem
              label="Insert column left"
              icon={ArrowLeftToLine}
              data-testid="radix-rte-table-add-column-before"
              onSelect={() => chain().addColumnBefore().run()}
            />
            <DropdownMenuItem
              label="Insert column right"
              icon={ArrowRightToLine}
              data-testid="radix-rte-table-add-column-after"
              onSelect={() => chain().addColumnAfter().run()}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              label="Cut row"
              icon={CutRowsIcon}
              data-testid="radix-rte-table-cut-row"
              disabled={!canCut.row}
              onSelect={() => chain().cutTableAxis('row').run()}
            />
            <DropdownMenuItem
              label="Cut column"
              icon={CutColumnsIcon}
              data-testid="radix-rte-table-cut-column"
              disabled={!canCut.column}
              onSelect={() => chain().cutTableAxis('column').run()}
            />
            {pendingCut && canPaste.before && (
              <DropdownMenuItem
                label={PASTE_ITEMS[pendingCut].before.label}
                icon={PASTE_ITEMS[pendingCut].before.icon}
                data-testid="radix-rte-table-paste-before"
                onSelect={() => chain().pasteTableAxis('before').run()}
              />
            )}
            {pendingCut && canPaste.after && (
              <DropdownMenuItem
                label={PASTE_ITEMS[pendingCut].after.label}
                icon={PASTE_ITEMS[pendingCut].after.icon}
                data-testid="radix-rte-table-paste-after"
                onSelect={() => chain().pasteTableAxis('after').run()}
              />
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              label="Merge cells"
              icon={TableCellsMerge}
              data-testid="radix-rte-table-merge-cells"
              disabled={!canMerge}
              onSelect={() => chain().mergeCells().run()}
            />
            <DropdownMenuItem
              label="Split cell"
              icon={TableCellsSplit}
              data-testid="radix-rte-table-split-cell"
              disabled={!canSplit}
              onSelect={() => chain().splitCell().run()}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              label="Toggle header row"
              icon={PanelTop}
              data-testid="radix-rte-table-toggle-header-row"
              onSelect={() => chain().toggleHeaderRow().run()}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              label="Delete row"
              icon={DeleteRowsIcon}
              data-testid="radix-rte-table-delete-row"
              onSelect={() => chain().deleteRow().run()}
            />
            <DropdownMenuItem
              label="Delete column"
              icon={DeleteColumnsIcon}
              data-testid="radix-rte-table-delete-column"
              onSelect={() => chain().deleteColumn().run()}
            />
            <DropdownMenuItem
              label="Delete table"
              icon={Trash2}
              data-testid="radix-rte-table-delete"
              variant="destructive"
              onSelect={() => chain().deleteTable().run()}
            />
          </>
        ) : (
          <DropdownMenuItem
            label="Insert table"
            icon={Grid2x2Plus}
            data-testid="radix-rte-table-insert"
            onSelect={() =>
              chain()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
