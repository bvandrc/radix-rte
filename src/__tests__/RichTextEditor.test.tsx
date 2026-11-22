import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay } from 'es-toolkit'

import type { RteFeature } from '@/lib/features'
import { SELECTORS } from '@/test-support/selectors'
import { RichTextEditor } from '../RichTextEditor'
import { ALL_COMPONENTS, BASE_COMPONENTS, renderEditor } from './__helpers__'

const {
  BOLD_BTN,
  ITALIC_BTN,
  STRIKETHROUGH_BTN,
  BULLET_LIST_BTN,
  NUMBERED_LIST_BTN,
  CODE_BLOCK_BTN,
  TOOLBAR_SEPARATOR,
  CHECKLIST,
  TABLE,
  FULLSCREEN_BTN,
  FULLSCREEN_CLOSE_BTN,
  FULLSCREEN_DIALOG,
} = SELECTORS

const ITEM_TEXT = {
  ONE: 'Buy milk',
  TWO: 'Walk dog',
} as const

const TEXT = {
  FIRST: 'Packing list: ',
  SECOND: 'socks, ',
  BOLD: 'passport',
} as const

const FEATURE_TEXT = 'Socks'

/**
 * Each optional feature's toolbar control, pasted HTML that uses it, and the
 * element that HTML becomes while the feature is on.
 */
const FEATURE_CASES = [
  {
    feature: 'bold',
    controlTestId: BOLD_BTN,
    html: `<p><strong>${FEATURE_TEXT}</strong></p>`,
    selector: 'strong',
  },
  {
    feature: 'italic',
    controlTestId: ITALIC_BTN,
    html: `<p><em>${FEATURE_TEXT}</em></p>`,
    selector: 'em',
  },
  {
    feature: 'strike',
    controlTestId: STRIKETHROUGH_BTN,
    html: `<p><s>${FEATURE_TEXT}</s></p>`,
    selector: 's',
  },
  {
    feature: 'bulletList',
    controlTestId: BULLET_LIST_BTN,
    html: `<ul><li><p>${FEATURE_TEXT}</p></li></ul>`,
    selector: 'ul',
  },
  {
    feature: 'orderedList',
    controlTestId: NUMBERED_LIST_BTN,
    html: `<ol><li><p>${FEATURE_TEXT}</p></li></ol>`,
    selector: 'ol',
  },
  {
    feature: 'checklist',
    controlTestId: CHECKLIST.TOGGLE_BTN,
    html: `<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>${FEATURE_TEXT}</p></li></ul>`,
    selector: 'ul[data-type="taskList"]',
  },
  {
    feature: 'codeBlock',
    controlTestId: CODE_BLOCK_BTN,
    html: `<pre><code>${FEATURE_TEXT}</code></pre>`,
    selector: 'pre',
  },
  {
    feature: 'table',
    controlTestId: TABLE.MENU_BTN,
    html: `<table><tbody><tr><td><p>${FEATURE_TEXT}</p></td></tr></tbody></table>`,
    selector: 'table',
  },
] as const satisfies readonly {
  feature: RteFeature
  controlTestId: string
  html: string
  selector: string
}[]

const PASTED_TABLE_HTML = `<table>
  <thead>
    <tr><th>Item</th><th>Store</th></tr>
  </thead>
  <tbody>
    <tr><td>Rake</td><td>Goodwill</td></tr>
  </tbody>
</table>`

/** Every part of this is dropped or neutered by the editor's schema parse. */
const HOSTILE_HTML = `<p onclick="alert(1)">Keep this text</p>
<script>window.__pastedScriptRan = true</script>
<img src="x" onerror="window.__pastedScriptRan = true">
<a href="javascript:alert(1)">link</a>`

/** Opens the toolbar's checklist menu, returning it once visible. */
const openChecklistMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId(CHECKLIST.TOGGLE_BTN))
  return screen.findByTestId(CHECKLIST.MENU)
}

/** Runs one of the checklist menu's actions. */
const clickChecklistMenuItem = async (
  user: ReturnType<typeof userEvent.setup>,
  item: string
) => {
  await openChecklistMenu(user)
  await user.click(await screen.findByTestId(item))
}

/** Dispatches a real clipboard paste event carrying `flavors`, keyed by MIME type. */
const paste = async (editor: HTMLElement, flavors: Record<string, string>) => {
  const clipboardData = new DataTransfer()
  for (const [type, data] of Object.entries(flavors)) {
    clipboardData.setData(type, data)
  }
  await act(async () => {
    editor.dispatchEvent(
      new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true,
        cancelable: true,
      })
    )
    await delay(50)
  })
}

/**
 * A real paste of markup that was copied as text: `text/plain` only, no
 * `text/html` flavor for TipTap to parse on its own.
 */
const pasteAsPlainText = (editor: HTMLElement, text: string) =>
  paste(editor, { 'text/plain': text })

describe('RichTextEditor', () => {
  describe('Mounting', () => {
    it('shows its content when the commit lands after tiptap has discarded the first editor', () => {
      vi.useFakeTimers()
      // Renders after the editor in the same pass and stands in for a slow
      // commit: tiptap destroys an editor its mount effect hasn't claimed
      // within 1ms of creating it.
      const SlowSibling = () => {
        vi.advanceTimersByTime(1)
        return null
      }

      renderEditor({ value: ITEM_TEXT.ONE }, { after: <SlowSibling /> })

      expect(screen.getByText(ITEM_TEXT.ONE)).toBeInTheDocument()
    })
  })

  describe('Toolbar', () => {
    it('resets its scroll position each time it reopens', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor(
        {},
        { before: <input data-testid="outside-field" /> }
      )

      await user.click(editor)
      const row = screen.getByTestId(BOLD_BTN).parentElement
      if (!row) throw new Error('toolbar row not found')
      // As if a previous open had scrolled it to reveal a later button.
      row.scrollLeft = 50

      // Closes the toolbar, then reopens it -- a fresh open should start
      // back at the first buttons rather than wherever it was left scrolled.
      await user.click(screen.getByTestId('outside-field'))
      await user.click(editor)

      expect(row.scrollLeft).toBe(0)
    })

    it('stays open until a press on the next control has finished, so that control stays under it', async () => {
      const user = userEvent.setup()
      const onToolbarVisibleChange = vi.fn()
      const { editor } = renderEditor(
        { onToolbarVisibleChange },
        { after: <button type="button" data-testid="next-field" /> }
      )
      const nextField = screen.getByTestId('next-field')
      await user.click(editor)

      await user.pointer({ keys: '[MouseLeft>]', target: nextField })
      // Focus has already moved on, on the way down.
      expect(nextField).toHaveFocus()
      expect(onToolbarVisibleChange).toHaveBeenLastCalledWith(true)

      await user.pointer({ keys: '[/MouseLeft]', target: nextField })
      // Once the press's click has landed.
      await waitFor(() =>
        expect(onToolbarVisibleChange).toHaveBeenLastCalledWith(false)
      )
    })

    it('closes as soon as focus tabs away', async () => {
      const user = userEvent.setup()
      const onToolbarVisibleChange = vi.fn()
      const { editor } = renderEditor(
        { onToolbarVisibleChange },
        { after: <button type="button" data-testid="next-field" /> }
      )
      await user.click(editor)

      await user.tab()

      expect(onToolbarVisibleChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('Outside value changes', () => {
    it('replaces typed content with a value set from outside, like a form reset', async () => {
      const user = userEvent.setup()
      const { editor, rerenderEditor } = renderEditor()

      // Typed edits the parent never echoes back, so they're still pending
      // when the outside value arrives.
      await user.click(editor)
      await user.keyboard(TEXT.FIRST)
      rerenderEditor({ value: '<p>Reset</p>' })

      expect(editor).toHaveTextContent(/^Reset$/)
    })
  })

  describe('Checklist auto-delete', () => {
    /** Inserts a checklist with two items, via the toolbar. */
    const insertChecklist = async (
      user: ReturnType<typeof userEvent.setup>,
      editor: HTMLElement
    ) => {
      await user.click(editor)
      await user.click(screen.getByTestId(CHECKLIST.TOGGLE_BTN))
      // Typed via the keyboard rather than into a specific element: the
      // caret is already where the toggle left it, and re-focusing to type
      // into a target loses that position.
      await user.keyboard(ITEM_TEXT.ONE)
      await user.keyboard('{Enter}')
      await user.keyboard(ITEM_TEXT.TWO)
      await waitFor(() =>
        expect(editor.querySelectorAll(CHECKLIST.UNCHECKED_ITEM)).toHaveLength(
          2
        )
      )
    }

    const getCheckboxes = (editor: HTMLElement) =>
      editor.querySelectorAll<HTMLInputElement>(
        'ul[data-type="taskList"] input[type="checkbox"]'
      )

    it('leaves a checked item in place while auto-delete is off', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertChecklist(user, editor)

      await user.click(getCheckboxes(editor)[0])

      expect(editor.querySelector(CHECKLIST.CHECKED_ITEM)).toHaveTextContent(
        ITEM_TEXT.ONE
      )
      expect(
        editor.querySelectorAll('ul[data-type="taskList"] li')
      ).toHaveLength(2)
    })

    it('removes an item as soon as it is checked once auto-delete is turned on', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertChecklist(user, editor)

      await clickChecklistMenuItem(user, CHECKLIST.AUTO_DELETE)
      await user.click(getCheckboxes(editor)[0])

      await waitFor(() =>
        expect(
          editor.querySelectorAll('ul[data-type="taskList"] li')
        ).toHaveLength(1)
      )
      expect(editor.querySelector(CHECKLIST.UNCHECKED_ITEM)).toHaveTextContent(
        ITEM_TEXT.TWO
      )
    })

    it('keeps the editor focused through a tapped menu, so the keyboard stays up', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertChecklist(user, editor)
      const onBlur = vi.fn()
      editor.addEventListener('blur', onBlur)

      // A finger rather than the mouse, the way a phone taps.
      await user.pointer({
        keys: '[TouchA]',
        target: screen.getByTestId(CHECKLIST.TOGGLE_BTN),
      })
      await user.pointer({
        keys: '[TouchA]',
        target: await screen.findByTestId(CHECKLIST.AUTO_DELETE),
      })

      await waitFor(() =>
        expect(screen.queryByTestId(CHECKLIST.MENU)).not.toBeInTheDocument()
      )
      expect(onBlur).not.toHaveBeenCalled()
      expect(editor).toHaveFocus()
    })

    it('removes the whole checklist when the last remaining item is checked', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await insertChecklist(user, editor)
      await clickChecklistMenuItem(user, CHECKLIST.AUTO_DELETE)
      await user.click(getCheckboxes(editor)[0])
      await waitFor(() =>
        expect(
          editor.querySelectorAll('ul[data-type="taskList"] li')
        ).toHaveLength(1)
      )

      await user.click(getCheckboxes(editor)[0])

      await waitFor(() =>
        expect(
          editor.querySelectorAll('ul[data-type="taskList"]')
        ).toHaveLength(0)
      )
    })
  })

  describe('Full screen', () => {
    it('carries typed content into the full-screen dialog', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await user.click(editor)
      await user.keyboard(TEXT.FIRST)

      await user.click(screen.getByTestId(FULLSCREEN_BTN))
      const dialog = await screen.findByTestId(FULLSCREEN_DIALOG)

      // The same editor instance moved across, text and all. `textContent`
      // rather than `toHaveTextContent`, since the latter normalizes away
      // the trailing space the fixture is deliberately checking for.
      expect(dialog.querySelector('.tiptap')?.textContent).toBe(TEXT.FIRST)
    })

    it('keeps the toolbar working inside the dialog', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await user.click(editor)
      await user.keyboard(TEXT.FIRST)
      await user.click(screen.getByTestId(FULLSCREEN_BTN))
      const dialog = await screen.findByTestId(FULLSCREEN_DIALOG)
      // The header's close button is the one way out of full screen.
      expect(
        within(dialog).queryByTestId(FULLSCREEN_BTN)
      ).not.toBeInTheDocument()

      await user.keyboard(TEXT.SECOND)
      await user.click(within(dialog).getByTestId(BOLD_BTN))
      await user.keyboard(TEXT.BOLD)

      expect(dialog.querySelector('.tiptap strong')).toHaveTextContent(
        TEXT.BOLD
      )
    })

    it('hands the edits back to the inline editor on close', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await user.click(editor)
      await user.keyboard(TEXT.FIRST)
      await user.click(screen.getByTestId(FULLSCREEN_BTN))
      const dialog = await screen.findByTestId(FULLSCREEN_DIALOG)
      await user.keyboard(TEXT.SECOND)

      await user.click(within(dialog).getByTestId(FULLSCREEN_CLOSE_BTN))

      await waitFor(() =>
        expect(screen.queryByTestId(FULLSCREEN_DIALOG)).not.toBeInTheDocument()
      )
      expect(editor.textContent).toBe(`${TEXT.FIRST}${TEXT.SECOND}`)
    })

    it("reports closing once from the header's close button", async () => {
      const user = userEvent.setup()
      const onFullscreenChange = vi.fn()
      renderEditor({ isFullscreen: true, onFullscreenChange })

      await user.click(await screen.findByTestId(FULLSCREEN_CLOSE_BTN))

      expect(onFullscreenChange.mock.calls).toEqual([[false]])
    })

    it('puts the caret back where it was on close, so typing carries on', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await user.click(editor)
      await user.click(screen.getByTestId(FULLSCREEN_BTN))
      const dialog = await screen.findByTestId(FULLSCREEN_DIALOG)
      await user.keyboard(TEXT.FIRST)

      await user.click(within(dialog).getByTestId(FULLSCREEN_CLOSE_BTN))

      await waitFor(() => expect(editor).toHaveFocus())
      await user.keyboard(TEXT.SECOND)
      expect(editor.textContent).toBe(`${TEXT.FIRST}${TEXT.SECOND}`)
    })
  })

  describe('Pasted HTML', () => {
    it('renders pasted HTML source as rich content', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await user.click(editor)

      await pasteAsPlainText(editor, PASTED_TABLE_HTML)

      expect(editor.querySelectorAll('table th')).toHaveLength(2)
      expect(editor.querySelectorAll('table td')).toHaveLength(2)
      expect(editor.querySelector('table th')).toHaveTextContent('Item')
      expect(editor.querySelector('table td')).toHaveTextContent('Rake')
      // The markup itself never lands as text.
      expect(editor).not.toHaveTextContent('<table>')
    })

    it('strips scripts and event handlers from a pasted payload', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await user.click(editor)

      await pasteAsPlainText(editor, HOSTILE_HTML)

      // The safe part of the paste still comes through.
      expect(editor).toHaveTextContent('Keep this text')
      // ...but nothing executable does.
      expect(editor.querySelector('script')).not.toBeInTheDocument()
      expect(editor.querySelector('[onclick]')).not.toBeInTheDocument()
      expect(editor.querySelector('[onerror]')).not.toBeInTheDocument()
      expect(
        editor.querySelector('a[href^="javascript:"]')
      ).not.toBeInTheDocument()
    })

    it('prefers the text/plain flavor over a styled text/html flavor', async () => {
      const user = userEvent.setup()
      const { editor } = renderEditor()
      await user.click(editor)

      // What copying a highlighted code block actually puts on the clipboard:
      // the raw markup as text, and the coloured <pre> as HTML. Taking the
      // text/html one would paste the tags back as text, which is the bug.
      await paste(editor, {
        'text/plain': PASTED_TABLE_HTML,
        'text/html':
          '<pre style="color: rgb(0, 0, 0)"><code><span>&lt;table&gt;</span></code></pre>',
      })

      expect(editor.querySelector('table td')).toHaveTextContent('Rake')
      expect(editor.querySelector('pre')).not.toBeInTheDocument()
      expect(editor).not.toHaveTextContent('<table>')
    })
  })

  describe('features', () => {
    it.each(FEATURE_CASES)(
      'leaves out the $feature control when it is off, and only that one',
      ({ feature, controlTestId }) => {
        renderEditor({ features: { [feature]: false } })

        expect(screen.queryByTestId(controlTestId)).not.toBeInTheDocument()
        for (const other of FEATURE_CASES) {
          if (other.feature === feature) continue
          expect(
            screen.queryByTestId(other.controlTestId),
            other.feature
          ).toBeInTheDocument()
        }
      }
    )

    // So the case below shows the content dropped, rather than HTML that was
    // never going to become it.
    it.each(FEATURE_CASES)(
      'keeps pasted $feature content while it is on',
      async ({ html, selector }) => {
        const user = userEvent.setup()
        const { editor } = renderEditor()
        await user.click(editor)

        await paste(editor, { 'text/html': html })

        expect(editor.querySelector(selector)).toBeInTheDocument()
      }
    )

    it.each(FEATURE_CASES)(
      'drops pasted $feature content when it is off, keeping the text',
      async ({ feature, html, selector }) => {
        const user = userEvent.setup()
        const { editor } = renderEditor({ features: { [feature]: false } })
        await user.click(editor)

        await paste(editor, { 'text/html': html })

        expect(editor.querySelector(selector)).not.toBeInTheDocument()
        expect(editor).toHaveTextContent(FEATURE_TEXT)
      }
    )

    it.each(FEATURE_CASES)(
      'drops $feature content passed in as `value` when it is off, keeping the text',
      ({ feature, html, selector }) => {
        const { editor } = renderEditor({
          features: { [feature]: false },
          value: html,
        })

        expect(editor.querySelector(selector)).not.toBeInTheDocument()
        expect(editor).toHaveTextContent(FEATURE_TEXT)
      }
    )

    it('puts separators only between the groups left with a control', () => {
      // Leaves the lists and the table: the first group and the code block's
      // are emptied.
      renderEditor({
        features: {
          bold: false,
          italic: false,
          strike: false,
          codeBlock: false,
        },
      })

      expect(screen.getAllByTestId(TOOLBAR_SEPARATOR)).toHaveLength(1)
    })

    it('keeps the features it was created with when the prop changes, warning once per change', () => {
      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined)
      onTestFinished(() => consoleWarn.mockRestore())
      const { rerenderEditor } = renderEditor({ features: { bold: false } })
      expect(consoleWarn).not.toHaveBeenCalled()

      rerenderEditor({ features: {} })
      // A fresh but equal object, as a host building it inline passes.
      rerenderEditor({ features: {} })

      expect(screen.queryByTestId(BOLD_BTN)).not.toBeInTheDocument()
      expect(consoleWarn).toHaveBeenCalledOnce()
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('change to bold is ignored')
      )
    })
  })

  describe('allowFullscreen', () => {
    it('leaves the full-screen button out when `false`', () => {
      render(
        <RichTextEditor
          allowFullscreen={false}
          value={null}
          onChange={vi.fn()}
          components={BASE_COMPONENTS}
        />
      )

      // The toolbar itself rendered, so the button's absence isn't just the
      // whole toolbar missing.
      expect(screen.getByTestId(BOLD_BTN)).toBeInTheDocument()
      expect(screen.queryByTestId(FULLSCREEN_BTN)).not.toBeInTheDocument()
    })

    it('brings the editor back inline when it turns `false` while full screen', async () => {
      const user = userEvent.setup()
      const { container, rerender } = render(
        <RichTextEditor
          value={null}
          onChange={vi.fn()}
          components={ALL_COMPONENTS}
        />
      )
      await user.click(screen.getByTestId(FULLSCREEN_BTN))
      await screen.findByTestId(FULLSCREEN_DIALOG)

      rerender(
        <RichTextEditor
          allowFullscreen={false}
          value={null}
          onChange={vi.fn()}
          components={BASE_COMPONENTS}
        />
      )

      expect(screen.queryByTestId(FULLSCREEN_DIALOG)).not.toBeInTheDocument()
      // Back in the field itself, not left as the empty placeholder that holds
      // its place while full screen.
      expect(container.querySelector('.tiptap')).toBeInTheDocument()
    })
  })
})
