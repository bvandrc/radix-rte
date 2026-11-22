/**
 * @fileoverview The editor's `data-testid`s, and the other selectors its tests
 * reach for. A host app's own registry spreads this in rather than restating
 * any of it.
 */

/** What every id starts with, and the shared stems of the table and checklist ids. */
const RTE = 'radix-rte'
const RTE_TABLE = `${RTE}-table`
const RTE_CHECKLIST = `${RTE}-checklist`
const FULLSCREEN_DIALOG = `${RTE}-fullscreen-dialog`

export const SELECTORS = {
  BOLD_BTN: `${RTE}-bold`,
  ITALIC_BTN: `${RTE}-italic`,
  STRIKETHROUGH_BTN: `${RTE}-strikethrough`,
  BULLET_LIST_BTN: `${RTE}-bullet-list`,
  NUMBERED_LIST_BTN: `${RTE}-numbered-list`,
  CODE_BLOCK_BTN: `${RTE}-code-block`,
  TOOLBAR_SEPARATOR: `${RTE}-toolbar-separator`,
  FULLSCREEN_BTN: `${RTE}-fullscreen`,
  FULLSCREEN_DIALOG,
  FULLSCREEN_SAVE_BTN: `${RTE}-fullscreen-save`,
  FULLSCREEN_CLOSE_BTN: `${RTE}-fullscreen-close`,
  FULLSCREEN_EDITOR: `[data-testid="${FULLSCREEN_DIALOG}"] .tiptap`,
  CHECKLIST: {
    TOGGLE_BTN: RTE_CHECKLIST,
    MENU: `${RTE_CHECKLIST}-menu`,
    AUTO_DELETE: `${RTE_CHECKLIST}-auto-delete`,
    REMOVE: `${RTE_CHECKLIST}-remove`,
    // In the live editor DOM, task items carry `data-checked` but only get
    // `data-type="taskItem"` in serialized HTML — select via the list parent.
    // The item's content `div`, not the `li`: the `li` also holds the checkbox's
    // visually-hidden label, whose text would join the item's own.
    CHECKED_ITEM: 'ul[data-type="taskList"] li[data-checked="true"] > div',
    UNCHECKED_ITEM: 'ul[data-type="taskList"] li[data-checked="false"] > div',
  },
  TABLE: {
    MENU_BTN: RTE_TABLE,
    MENU: `${RTE_TABLE}-menu`,
    INSERT: `${RTE_TABLE}-insert`,
    ADD_ROW_BEFORE: `${RTE_TABLE}-add-row-before`,
    ADD_ROW_AFTER: `${RTE_TABLE}-add-row-after`,
    ADD_COLUMN_BEFORE: `${RTE_TABLE}-add-column-before`,
    ADD_COLUMN_AFTER: `${RTE_TABLE}-add-column-after`,
    CUT_ROW: `${RTE_TABLE}-cut-row`,
    CUT_COLUMN: `${RTE_TABLE}-cut-column`,
    PASTE_BEFORE: `${RTE_TABLE}-paste-before`,
    PASTE_AFTER: `${RTE_TABLE}-paste-after`,
    CUT_CELL: `${RTE_TABLE}-cut-cell`,
    MERGE_CELLS: `${RTE_TABLE}-merge-cells`,
    SPLIT_CELL: `${RTE_TABLE}-split-cell`,
    TOGGLE_HEADER_ROW: `${RTE_TABLE}-toggle-header-row`,
    DELETE_ROW: `${RTE_TABLE}-delete-row`,
    DELETE_COLUMN: `${RTE_TABLE}-delete-column`,
    DELETE: `${RTE_TABLE}-delete`,
  },
} as const
