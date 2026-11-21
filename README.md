# @bvandrc/radix-rich-text-editor

A [Tiptap](https://tiptap.dev) rich text editor for React, built on [Radix](https://www.radix-ui.com) and Tailwind. It has a formatting toolbar, checklists, tables, and an optional full-screen mode. It draws its frame, menus, and dialog with your own components and takes its colors from your theme, so it looks like the rest of your app. If you use shadcn/ui, it fits as is.

```bash
npm install @bvandrc/radix-rich-text-editor radix-ui
```

Requires React 19, Tailwind CSS v4, and `radix-ui`. ESM only, with types included. Each export's JSDoc, shipped in the `dist/*.d.mts` types, covers its props and edge cases; this README is an index.

## Setup

Import the editor's stylesheet into your app's Tailwind stylesheet, after Tailwind itself:

```css
@import "tailwindcss";
@import "@bvandrc/radix-rich-text-editor/styles.css";
```

## Usage

The editor's value is an HTML string, or `null` when it's empty.

```tsx
import { RichTextEditor } from '@bvandrc/radix-rich-text-editor'
import { useState } from 'react'

// Your own parts for the editor to draw with; see Components below.
import { COMPONENTS } from './rte-components'

const Notes = () => {
  const [notes, setNotes] = useState<string | null>(null)

  return (
    <RichTextEditor
      label="Notes"
      value={notes}
      onChange={setNotes}
      components={COMPONENTS}
    />
  )
}
```

### Components

The editor doesn't draw its frame, toolbar menus, or full-screen dialog itself. It takes them from you through `components`, so they match the rest of your app. Each part takes the props of the Radix part it stands for, so components built on Radix fit as they are. A few take one or two props on top, like the menu item's `label` and `icon`.

| Part | Stands for |
| --- | --- |
| `Field` | The frame around the toolbar and text: a `div` that draws the border, background, and focus ring. |
| `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuSeparator` | Radix's `DropdownMenu` parts, for the toolbar's checklist and table menus. |
| `Dialog`, `DialogContent`, `DialogTitle`, `DialogClose` | Radix's `Dialog` parts, for the full-screen dialog. |
| `Button` | The full-screen dialog's Save and close buttons, in shadcn's `variant` and `size` names. |

The dialog parts and `Button` aren't needed when `allowFullscreen` is `false`. The `RteBaseComponents` and `RteFullscreenComponents` types describe each part, and `satisfies` checks yours against them.

### Editors

| Export | What it does |
| --- | --- |
| `RichTextEditor` | The editor, with full screen unless `allowFullscreen` is `false`. |
| `RteFullscreenAllowed` | The editor with full screen, on its own. |
| `RteNoFullscreen` | The editor without full screen, on its own, so none of the full-screen code reaches your bundle. |

### Features

Every formatting feature is on by default. Turn one off with `features`, like `features={{ table: false }}`, and its toolbar control and the Tiptap extensions behind it both go, so content that uses it is dropped when pasted or passed in. Features are read once, when the editor is created.

`bold`, `italic`, `strike`, `bulletList`, `orderedList`, `checklist`, `codeBlock`, and `table`.

## Theming

The editor's colors are its own Tailwind theme colors. Each is named for the shadcn color of its role and defaults to it, so an app with a shadcn theme needs to set nothing. To change one, set it in your own `@theme` or on `:root`.

| Variable | Colors |
| --- | --- |
| `--color-radix-rte-foreground` | Text on active and hovered toolbar buttons. |
| `--color-radix-rte-muted-foreground` | Placeholder text, and checked checklist items. |
| `--color-radix-rte-primary` | Selected table cells, a cut row or column's outline, and the column resize handle. |
| `--color-radix-rte-secondary` | Active and hovered toolbar buttons' backgrounds, and table header cells. |
| `--color-radix-rte-border` | Table cell borders. |
| `--color-radix-rte-divider` | The toolbar's separators and borders, and the full-screen header's. |
| `--color-radix-rte-destructive` | The red badge on the table menu's delete icons. |

## Other Entry Points

| Entry point | What it has |
| --- | --- |
| `@bvandrc/radix-rich-text-editor/utils` | React-free helpers for the HTML the editor reads and writes, safe on a server: `isEditorHtml`, `isHtmlMarkup`, and `toEditorContent`, which turns a plain-text value from before you had rich text into HTML the editor reads. |
| `@bvandrc/radix-rich-text-editor/icons` | The badged icons the table menu uses, like `CutRowsIcon`, and `buildBadgedIcon` for drawing more of them. |
| `@bvandrc/radix-rich-text-editor/test-support` | `SELECTORS`, the editor's `data-testid`s, for your own tests to reach its toolbar and menus. |

## License

MIT
