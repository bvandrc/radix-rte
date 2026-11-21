/**
 * @fileoverview The rich text editor's cut and paste for whole table rows
 * and columns.
 *
 * Exports the extension, plus the state and types `toolbar/TableMenu` reads
 * to show what can be cut or pasted.
 */

import { Extension, type RawCommands } from '@tiptap/core'
import { Table } from '@tiptap/extension-table'
import { type EditorState, Plugin, PluginKey } from '@tiptap/pm/state'
import {
  isInTable as isSelectionInTable,
  moveTableColumn,
  moveTableRow,
  type Rect,
  selectedRect,
  TableMap,
} from '@tiptap/pm/tables'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { inRange, range } from 'es-toolkit'

const PLUGIN_NAME = 'tableCutPaste'

export type TableAxis = 'row' | 'column'

/** Where a paste lands relative to the caret's row or column. */
export type TablePasteSide = 'before' | 'after'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableCutPaste: {
      /** Marks the caret's row or column to be moved by the next paste. */
      cutTableAxis: (axis: TableAxis) => ReturnType
      /** Moves the cut row or column beside the caret's own. */
      pasteTableAxis: (side: TablePasteSide) => ReturnType
    }
  }
}

/** A row or column marked by "Cut", waiting for a paste to move it. */
interface PendingTableCut {
  axis: TableAxis
  index: number
  /** The table's own position, which tells a paste whether it's in the same table. */
  tablePos: number
}

const tableCutKey = new PluginKey<PendingTableCut | null>(PLUGIN_NAME)

export const getPendingTableCut = (state: EditorState) =>
  tableCutKey.getState(state) ?? null

/** The rows or columns a rect spans along one axis, end exclusive. */
const getAxisSpan = (rect: Rect, axis: TableAxis) =>
  axis === 'row'
    ? { start: rect.top, end: rect.bottom }
    : { start: rect.left, end: rect.right }

/** The lines (rows or columns) along `axis`, and the cells in each. */
const getAxisSize = (map: TableMap, axis: TableAxis) =>
  axis === 'row'
    ? { lines: map.height, length: map.width }
    : { lines: map.width, length: map.height }

/** The position of the cell at `offset` along the row or column `line`. */
const getCellAt = (
  map: TableMap,
  axis: TableAxis,
  line: number,
  offset: number
) =>
  axis === 'row'
    ? map.map[line * map.width + offset]
    : map.map[offset * map.width + line]

/** Whether two rows or columns along `axis` share a merged cell; false when `other` is off the table. */
const sharesMergedCell = (
  map: TableMap,
  axis: TableAxis,
  index: number,
  other: number
) => {
  const { lines, length } = getAxisSize(map, axis)
  return (
    inRange(other, lines) &&
    range(length).some(
      (offset) =>
        getCellAt(map, axis, index, offset) ===
        getCellAt(map, axis, other, offset)
    )
  )
}

/**
 * Whether a row or column shares a merged cell with either neighbor along `axis`.
 *
 * Cells merged within the row or column itself don't count: those move with
 * it whole.
 */
const isInMergeGroup = (map: TableMap, axis: TableAxis, index: number) =>
  sharesMergedCell(map, axis, index, index - 1) ||
  sharesMergedCell(map, axis, index, index + 1)

/** Whether a row or column has no cells of its own, all merged in from the one before. */
const isFullyCovered = (map: TableMap, axis: TableAxis, index: number) =>
  index > 0 &&
  range(getAxisSize(map, axis).length).every(
    (offset) =>
      getCellAt(map, axis, index, offset) ===
      getCellAt(map, axis, index - 1, offset)
  )

/** The rect covering one whole row or column of a table. */
const getAxisRect = (map: TableMap, axis: TableAxis, index: number): Rect =>
  axis === 'row'
    ? { left: 0, right: map.width, top: index, bottom: index + 1 }
    : { left: index, right: index + 1, top: 0, bottom: map.height }

const cutTableAxis: RawCommands['cutTableAxis'] =
  (axis) =>
  ({ state, tr, dispatch }) => {
    if (!isSelectionInTable(state)) return false
    const rect = selectedRect(state)
    const { start } = getAxisSpan(rect, axis)
    // The move widens itself to a whole merge group, so cutting part of one
    // would move rows or columns the outline never marked.
    if (isInMergeGroup(rect.map, axis, start)) return false
    if (dispatch) {
      tr.setMeta(tableCutKey, {
        axis,
        index: start,
        tablePos: rect.tableStart - 1,
      } satisfies PendingTableCut)
    }
    return true
  }

const pasteTableAxis: RawCommands['pasteTableAxis'] =
  (side) =>
  ({ state, tr, dispatch }) => {
    const cut = getPendingTableCut(state)
    if (!cut || !isSelectionInTable(state)) return false
    const rect = selectedRect(state)
    // Moving between tables isn't something the table commands do.
    if (rect.tableStart - 1 !== cut.tablePos) return false

    const { start, end } = getAxisSpan(rect, cut.axis)
    const anchor = side === 'before' ? start : end - 1
    // The target widens to its whole merge group, so a merge across the side
    // being pasted on would land the paste on the far side of it. One on the
    // other side moves with the group and leaves this edge where it is.
    const neighbor = side === 'before' ? anchor - 1 : anchor + 1
    if (sharesMergedCell(rect.map, cut.axis, anchor, neighbor)) return false
    // The move lifts the cut row/column out before placing it, so a
    // target past it sits one index earlier by then.
    const to =
      (side === 'before' ? anchor : anchor + 1) - (cut.index < anchor ? 1 : 0)

    // The move finds its target by the cells in that row or column, and one
    // with none of its own (all merged in from the one before) sends the cut
    // into the middle of that merge instead.
    if (isFullyCovered(rect.map, cut.axis, to)) return false

    // Pasting onto itself just puts the cut down.
    if (cut.index === anchor || to === cut.index) {
      if (dispatch) tr.setMeta(tableCutKey, null)
      return true
    }

    const move = cut.axis === 'row' ? moveTableRow : moveTableColumn
    return move({ from: cut.index, to, pos: rect.tableStart })(state, dispatch)
  }

const tableCutPlugin = new Plugin<PendingTableCut | null>({
  key: tableCutKey,
  state: {
    init: () => null,
    apply: (tr, cut) => {
      const meta: PendingTableCut | null | undefined = tr.getMeta(tableCutKey)
      if (meta !== undefined) return meta
      return tr.docChanged ? null : cut
    },
  },
  view: (view) => {
    // Escape drops the cut. Listened for on the window, in the capture
    // phase: a dialog the editor sits in may take Escape on the document
    // first, blurring the editor and marking the key handled, so neither a
    // keymap nor a listener on the editor would still see it in focus.
    const dropCutOnEscape = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        view.hasFocus() &&
        getPendingTableCut(view.state)
      ) {
        view.dispatch(view.state.tr.setMeta(tableCutKey, null))
      }
    }
    window.addEventListener('keydown', dropCutOnEscape, true)
    return {
      destroy: () =>
        window.removeEventListener('keydown', dropCutOnEscape, true),
    }
  },
  props: {
    // Outlines the cut cells, the way a spreadsheet marks its own cut.
    decorations: (state) => {
      const cut = getPendingTableCut(state)
      const table = cut && state.doc.nodeAt(cut.tablePos)
      if (!cut || table?.type.name !== Table.name) return null

      const map = TableMap.get(table)
      const tableStart = cut.tablePos + 1
      const cells = map.cellsInRect(getAxisRect(map, cut.axis, cut.index))
      return DecorationSet.create(
        state.doc,
        cells.map((pos) =>
          Decoration.node(
            tableStart + pos,
            tableStart + pos + (table.nodeAt(pos)?.nodeSize ?? 0),
            { class: 'cutCell', 'data-testid': 'radix-rte-table-cut-cell' }
          )
        )
      )
    },
  },
})

/**
 * Cut and paste for whole table rows and columns, spreadsheet-style.
 *
 * Cutting only marks the row or column (outlined until pasted); the paste
 * moves its content. Header cells stay where they are, the way "Toggle header
 * row" keeps the header on the first row. Neither a cut nor a paste splits
 * cells merged across rows or columns.
 * Escape drops the mark, as in a spreadsheet, and so does any other edit, since
 * it can shift what the cut pointed at.
 */
export const TableCutPaste = Extension.create({
  name: PLUGIN_NAME,
  addCommands() {
    return { cutTableAxis, pasteTableAxis }
  },
  addProseMirrorPlugins() {
    return [tableCutPlugin]
  },
})
