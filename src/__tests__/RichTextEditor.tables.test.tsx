import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { findChildren, type TiptapEditorHTMLElement } from '@tiptap/core'

import { mockDialogEscape } from '@/test-support/dialog-escape'
import { SELECTORS } from '@/test-support/selectors'
import { renderEditor } from './__helpers__'

const { TABLE } = SELECTORS

const CELL_TEXT = {
  HEADER: 'Step',
  BODY: 'Book flights',
} as const

/** One label per row or column, so a test can read back the order they ended up in. */
const LINE_TEXT = {
  A: 'Alpha',
  B: 'Bravo',
} as const

/** Opens the toolbar's table menu, returning queries bound to it once visible. */
const openTableMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId(TABLE.MENU_BTN))
  return within(await screen.findByTestId(TABLE.MENU))
}

/** Runs one of the table menu's actions. */
const clickTableMenuItem = async (
  user: ReturnType<typeof userEvent.setup>,
  item: string
) => {
  await openTableMenu(user)
  await user.click(await screen.findByTestId(item))
}

/**
 * Inserts a 3x3 table with a header row, and waits for it to land -- the
 * caret ends up in the first header cell, same as a fresh insert in the
 * browser.
 */
const insertTable = async (
  user: ReturnType<typeof userEvent.setup>,
  editor: HTMLElement
) => {
  await user.click(editor)
  await clickTableMenuItem(user, TABLE.INSERT)
  await waitFor(() => expect(editor.querySelectorAll('tr')).toHaveLength(3))
}

/** Seeds a table and puts the caret in the cell reading `text`. */
const renderTableAt = async (
  user: ReturnType<typeof userEvent.setup>,
  html: string,
  text: string
) => {
  const { editor } = renderEditor({ value: html })
  // The first click only focuses the editor, which keeps its own caret.
  await user.click(editor)
  await user.click(within(editor).getByText(text))
  return editor
}

/** Selects the block of cells from the one reading `from` to the one reading `to`. */
const selectCells = (editorElement: HTMLElement, from: string, to: string) => {
  // Through Tiptap's own editor rather than a pointer drag, so which cells a
  // case selects doesn't hang on the table's layout at the test's viewport.
  const { editor } = editorElement as TiptapEditorHTMLElement
  if (!editor) throw new Error('no TipTap editor on this element')
  const findCellPos = (text: string) =>
    findChildren(
      editor.state.doc,
      (node) =>
        node.type.spec.tableRole?.endsWith('cell') && node.textContent === text
    )[0].pos
  act(() => {
    editor.commands.setCellSelection({
      anchorCell: findCellPos(from),
      headCell: findCellPos(to),
    })
  })
}

/** Reads the text of each row's cell in one column, top to bottom. */
const getColumnText = (editor: HTMLElement, index: number) =>
  [...editor.querySelectorAll('table tr')].map(
    (row) => row.children[index]?.textContent ?? ''
  )

/** Reads the text of each header cell, left to right. */
const getHeaderText = (editor: HTMLElement) =>
  [...editor.querySelectorAll('table th')].map((cell) => cell.textContent ?? '')

describe('Tables', () => {
  it('inserts a 3x3 table with a header row', async () => {
    const user = userEvent.setup()
    const { editor } = renderEditor()

    await insertTable(user, editor)

    // 3 header cells, 2 body rows of 3 cells.
    expect(editor.querySelector('table')).toBeInTheDocument()
    expect(editor.querySelectorAll('table th')).toHaveLength(3)
    expect(editor.querySelectorAll('table tr')).toHaveLength(3)
    expect(editor.querySelectorAll('table td')).toHaveLength(6)
  })

  it('tab-navigates from the header into the body row while typing', async () => {
    const user = userEvent.setup()
    const { editor } = renderEditor()
    await insertTable(user, editor)

    await user.keyboard(CELL_TEXT.HEADER)
    // Tab moves to the next cell -- from the last header cell into the body row.
    await user.keyboard('{Tab}{Tab}{Tab}')
    await user.keyboard(CELL_TEXT.BODY)

    expect(editor.querySelector('table th')).toHaveTextContent(CELL_TEXT.HEADER)
    expect(editor.querySelector('table td')).toHaveTextContent(CELL_TEXT.BODY)
  })

  it('toggles the header row off and back on', async () => {
    const user = userEvent.setup()
    const { editor } = renderEditor()
    await insertTable(user, editor)

    await clickTableMenuItem(user, TABLE.TOGGLE_HEADER_ROW)
    expect(editor.querySelectorAll('table th')).toHaveLength(0)

    await clickTableMenuItem(user, TABLE.TOGGLE_HEADER_ROW)
    expect(editor.querySelectorAll('table th')).toHaveLength(3)
  })

  it('deletes the whole table', async () => {
    const user = userEvent.setup()
    const { editor } = renderEditor()
    await insertTable(user, editor)

    await clickTableMenuItem(user, TABLE.DELETE)

    expect(editor.querySelector('table')).not.toBeInTheDocument()
  })

  describe('Focus', () => {
    it('keeps the editor focused through a tapped menu, so the keyboard stays up', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await user.click(editor)
      const onBlur = vi.fn()
      editor.addEventListener('blur', onBlur)

      // A finger rather than the mouse, the way a phone taps.
      await user.pointer({
        keys: '[TouchA]',
        target: screen.getByTestId(TABLE.MENU_BTN),
      })
      await user.pointer({
        keys: '[TouchA]',
        target: await screen.findByTestId(TABLE.INSERT),
      })

      await waitFor(() => expect(editor.querySelectorAll('tr')).toHaveLength(3))
      expect(onBlur).not.toHaveBeenCalled()
      expect(editor).toHaveFocus()
    })

    it('moves focus into a menu opened by mouse, for the arrow keys', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await user.click(editor)

      await openTableMenu(user)
      expect(screen.getByTestId(TABLE.MENU)).toHaveFocus()

      // Close it and wait for its deferred focus hand-back, so it doesn't fire
      // at an editor the next case has already unmounted.
      await user.keyboard('{Escape}')
      await waitFor(() => expect(editor).toHaveFocus())
    })
  })

  describe('Adding/Deleting Rows and Columns', () => {
    it("adds a row after the caret's row", async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)

      await clickTableMenuItem(user, TABLE.ADD_ROW_AFTER)

      expect(editor.querySelectorAll('table tr')).toHaveLength(4)
    })

    it("adds a column after the caret's column", async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)

      await clickTableMenuItem(user, TABLE.ADD_COLUMN_AFTER)

      expect(editor.querySelectorAll('table th')).toHaveLength(4)
    })

    it("deletes the caret's row", async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)
      // Move into a body row, so what's deleted isn't the header.
      await user.keyboard('{Tab}{Tab}{Tab}')

      await clickTableMenuItem(user, TABLE.DELETE_ROW)

      expect(editor.querySelectorAll('table tr')).toHaveLength(2)
      expect(editor.querySelectorAll('table th')).toHaveLength(3)
    })

    it("deletes the caret's column", async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)

      await clickTableMenuItem(user, TABLE.DELETE_COLUMN)

      expect(editor.querySelectorAll('table th')).toHaveLength(2)
      expect(editor.querySelectorAll('table td')).toHaveLength(4)
    })
  })

  describe('Cut and paste', () => {
    /**
     * Labels the first cell of each body row (A, then B), leaving the caret
     * in row B's first cell.
     */
    const labelBodyRows = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.keyboard(`{Tab}{Tab}{Tab}${LINE_TEXT.A}`)
      await user.keyboard(`{Tab}{Tab}{Tab}${LINE_TEXT.B}`)
    }

    it("moves a cut row above the caret's row", async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)
      await labelBodyRows(user)

      // Cut row B, which is where the caret is.
      const menu = await openTableMenu(user)
      expect(
        menu.queryByTestId(TABLE.PASTE_BEFORE),
        'Nothing to paste until the cut'
      ).not.toBeInTheDocument()
      await user.click(menu.getByTestId(TABLE.CUT_ROW))
      expect(
        screen.getAllByTestId(TABLE.CUT_CELL),
        'cut outlines the whole row'
      ).toHaveLength(3)

      // Back up into row A.
      await user.keyboard('{Shift>}{Tab}{Tab}{Tab}{/Shift}')
      await clickTableMenuItem(user, TABLE.PASTE_BEFORE)

      expect(getColumnText(editor, 0), 'correctly pasted') //
        .toEqual(['', LINE_TEXT.B, LINE_TEXT.A])
      expect(
        screen.queryByTestId(TABLE.CUT_CELL),
        'no longer outlined'
      ).not.toBeInTheDocument()
    })

    it("moves a cut row below the caret's row", async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)
      await labelBodyRows(user)

      // Back up into row A, and cut it.
      await user.keyboard('{Shift>}{Tab}{Tab}{Tab}{/Shift}')
      await clickTableMenuItem(user, TABLE.CUT_ROW)

      // Down to Row B, and paste after it.
      await user.keyboard('{Tab}{Tab}{Tab}')
      await clickTableMenuItem(user, TABLE.PASTE_AFTER)

      expect(getColumnText(editor, 0), 'correctly pasted') //
        .toEqual(['', LINE_TEXT.B, LINE_TEXT.A])
    })

    it("moves a cut column left of the caret's column", async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)
      await user.keyboard(`${LINE_TEXT.A}{Tab}${LINE_TEXT.B}`)

      await clickTableMenuItem(user, TABLE.CUT_COLUMN)
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      await clickTableMenuItem(user, TABLE.PASTE_BEFORE)

      expect(getHeaderText(editor), 'correctly pasted') //
        .toEqual([LINE_TEXT.B, LINE_TEXT.A, ''])
    })

    it("moves a cut column right of the caret's column", async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)
      await user.keyboard(`${LINE_TEXT.A}{Tab}${LINE_TEXT.B}`)
      await user.keyboard('{Shift>}{Tab}{/Shift}')

      await clickTableMenuItem(user, TABLE.CUT_COLUMN)
      await user.keyboard('{Tab}{Tab}')
      await clickTableMenuItem(user, TABLE.PASTE_AFTER)

      expect(getHeaderText(editor), 'correctly pasted') //
        .toEqual([LINE_TEXT.B, '', LINE_TEXT.A])
    })

    it('drops the cut once the table is edited', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)

      await clickTableMenuItem(user, TABLE.CUT_ROW)
      await user.keyboard(LINE_TEXT.A)

      expect(screen.queryByTestId(TABLE.CUT_CELL), 'cut outline removed') //
        .not.toBeInTheDocument()

      const menu = await openTableMenu(user)
      expect(menu.queryByTestId(TABLE.PASTE_BEFORE)).not.toBeInTheDocument()

      // Close it and wait for its deferred focus hand-back, so it doesn't fire
      // at an editor the next case has already unmounted.
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(editor).toHaveFocus())
    })

    it('drops the cut on Escape without moving anything', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)
      await labelBodyRows(user)

      await clickTableMenuItem(user, TABLE.CUT_ROW)
      // The closing menu hands focus back to the editor; Escape only drops
      // the cut once it's there.
      await waitFor(() => expect(editor).toHaveFocus())
      await user.keyboard('{Escape}')

      expect(screen.queryByTestId(TABLE.CUT_CELL)).not.toBeInTheDocument()
      expect(getColumnText(editor, 0)).toEqual(['', LINE_TEXT.A, LINE_TEXT.B])
    })

    it('drops the cut on Escape inside a dialog that handles Escape first', async () => {
      // As a host's dialog around the editor can, taking Escape first.
      mockDialogEscape()
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)

      await clickTableMenuItem(user, TABLE.CUT_ROW)
      await waitFor(() => expect(editor).toHaveFocus())
      await user.keyboard('{Escape}')

      expect(screen.queryByTestId(TABLE.CUT_CELL)).not.toBeInTheDocument()
    })

    it('keeps header cells on the first row when its content moves', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertTable(user, editor)
      await user.keyboard(CELL_TEXT.HEADER)

      await clickTableMenuItem(user, TABLE.CUT_ROW)
      await user.keyboard('{Tab}{Tab}{Tab}')
      await clickTableMenuItem(user, TABLE.PASTE_AFTER)

      expect(getColumnText(editor, 0)).toEqual(['', CELL_TEXT.HEADER, ''])
      expect(getHeaderText(editor), 'header stays on top').toEqual(['', '', ''])
    })

    describe('Merged cells', () => {
      // B's first cell spans rows B and C.
      const ROWS_MERGED_TABLE =
        '<table><tr><td>A</td><td>a</td></tr>' +
        '<tr><td rowspan="2">B</td><td>b</td></tr><tr><td>c</td></tr>' +
        '<tr><td>D</td><td>d</td></tr></table>'

      it("won't cut a row that shares a merged cell with another", async () => {
        const user = userEvent.setup()
        const editor = await renderTableAt(user, ROWS_MERGED_TABLE, 'b')

        const menu = await openTableMenu(user)

        expect(menu.getByTestId(TABLE.CUT_ROW)).toHaveAttribute('data-disabled')
        expect(menu.getByTestId(TABLE.CUT_COLUMN)).not.toHaveAttribute(
          'data-disabled'
        )
        // Close it and wait for its deferred focus hand-back, so it doesn't fire
        // at an editor the next case has already unmounted.
        await userEvent.keyboard('{Escape}')
        await waitFor(() => expect(editor).toHaveFocus())
      })

      it("won't paste into a merged group, but pastes past it", async () => {
        const user = userEvent.setup()
        const editor = await renderTableAt(user, ROWS_MERGED_TABLE, 'A')
        await clickTableMenuItem(user, TABLE.CUT_ROW)

        // Above C would land between the rows B's cell spans.
        await user.click(within(editor).getByText('c'))
        const menu = await openTableMenu(user)
        expect(menu.queryByTestId(TABLE.PASTE_BEFORE)).not.toBeInTheDocument()
        await user.click(menu.getByTestId(TABLE.PASTE_AFTER))

        expect(getColumnText(editor, 0)).toEqual(['B', 'c', 'A', 'D'])
      })

      it('pastes above a merged group from below it, keeping the merge', async () => {
        const user = userEvent.setup()
        const editor = await renderTableAt(user, ROWS_MERGED_TABLE, 'D')
        await clickTableMenuItem(user, TABLE.CUT_ROW)

        await user.click(within(editor).getByText('b'))
        await clickTableMenuItem(user, TABLE.PASTE_BEFORE)

        expect(getColumnText(editor, 0)).toEqual(['A', 'D', 'B', 'c'])
        expect(within(editor).getByText('B').closest('td')).toHaveAttribute(
          'rowspan',
          '2'
        )
      })

      it('only pastes below a row whose neighbor is merged over whole', async () => {
        const user = userEvent.setup()
        // B's one cell covers both of the rows between A and D, leaving the
        // second with no cells of its own.
        const editor = await renderTableAt(
          user,
          '<table><tr><td>A</td><td>a</td></tr>' +
            '<tr><td rowspan="2" colspan="2">B</td></tr><tr></tr>' +
            '<tr><td>D</td><td>d</td></tr></table>',
          'A'
        )
        await clickTableMenuItem(user, TABLE.CUT_ROW)

        await user.click(within(editor).getByText('D'))
        const menu = await openTableMenu(user)
        expect(menu.queryByTestId(TABLE.PASTE_BEFORE)).not.toBeInTheDocument()
        await user.click(menu.getByTestId(TABLE.PASTE_AFTER))

        expect(getColumnText(editor, 0)).toEqual(['B', '', 'D', 'A'])
      })

      it('cuts a row whose own cells are merged', async () => {
        const user = userEvent.setup()
        const editor = await renderTableAt(
          user,
          '<table><tr><td>A</td><td>a</td></tr>' +
            '<tr><td colspan="2">E</td></tr>' +
            '<tr><td>C</td><td>c</td></tr></table>',
          'E'
        )

        await clickTableMenuItem(user, TABLE.CUT_ROW)
        await user.click(within(editor).getByText('A'))
        await clickTableMenuItem(user, TABLE.PASTE_BEFORE)

        expect(getColumnText(editor, 0)).toEqual(['E', 'A', 'C'])
      })
    })
  })

  describe('Merge and split', () => {
    const GRID_TABLE =
      '<table><tr><td>A</td><td>a</td></tr><tr><td>B</td><td>b</td></tr></table>'

    it('offers neither for a single unmerged cell', async () => {
      const user = userEvent.setup()
      const editor = await renderTableAt(user, GRID_TABLE, 'A')

      const menu = await openTableMenu(user)

      for (const item of [TABLE.MERGE_CELLS, TABLE.SPLIT_CELL]) {
        expect(menu.getByTestId(item), item).toHaveAttribute('data-disabled')
      }
      // Close it and wait for its deferred focus hand-back, so it doesn't fire
      // at an editor the next case has already unmounted.
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(editor).toHaveFocus())
    })

    it('merges the selected cells into one', async () => {
      const user = userEvent.setup()
      const editor = await renderTableAt(user, GRID_TABLE, 'A')
      selectCells(editor, 'A', 'b')

      await clickTableMenuItem(user, TABLE.MERGE_CELLS)

      const cells = editor.querySelectorAll('td')
      expect(cells).toHaveLength(1)
      expect(cells[0]).toHaveAttribute('colspan', '2')
      expect(cells[0]).toHaveAttribute('rowspan', '2')
      // Their content joins, row by row.
      expect(cells[0]).toHaveTextContent('AaBb')
    })

    it('splits a merged cell back into its own cells', async () => {
      const user = userEvent.setup()
      const editor = await renderTableAt(
        user,
        '<table><tr><td colspan="2">E</td></tr><tr><td>C</td><td>c</td></tr></table>',
        'E'
      )

      await clickTableMenuItem(user, TABLE.SPLIT_CELL)

      expect(editor.querySelectorAll('tr:first-child td')).toHaveLength(2)
      expect(getColumnText(editor, 0)).toEqual(['E', 'C'])
    })
  })
})
