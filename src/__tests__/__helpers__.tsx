/**
 * @fileoverview The parts and render helper the editor's tests share.
 */

import { render } from '@testing-library/react'
import { Dialog, DropdownMenu } from 'radix-ui'
import type { DistributedOmit } from 'type-fest'
import type { Mock } from 'vitest'

import type {
  RteBaseComponents,
  RteFullscreenComponents,
} from '@/lib/components'
import { RichTextEditor } from '@/RichTextEditor'
import type { RteFullscreenAllowedProps } from '@/RteFullscreenAllowed'

/** The editor's props, less the parts `renderEditor` fills in. */
type EditorProps = DistributedOmit<RteFullscreenAllowedProps, 'components'>

// Radix's own parts, unstyled, the way a host with no design system of its
// own could pass them. The menus and the dialog are portalled, as a host's
// usually are.
export const BASE_COMPONENTS = {
  Field: (props) => <div {...props} />, // Radix has no field; a bare `div`.
  DropdownMenu: DropdownMenu.Root,
  DropdownMenuTrigger: DropdownMenu.Trigger,
  DropdownMenuContent: (props) => (
    <DropdownMenu.Portal>
      <DropdownMenu.Content {...props} />
    </DropdownMenu.Portal>
  ),
  // Radix's item takes neither a `label` nor an `icon`, so they become its
  // children here.
  DropdownMenuItem: ({ label, icon: IconComponent, variant: _, ...props }) => (
    <DropdownMenu.Item {...props}>
      {IconComponent && <IconComponent />}
      {label}
    </DropdownMenu.Item>
  ),
  DropdownMenuCheckboxItem: DropdownMenu.CheckboxItem,
  DropdownMenuSeparator: DropdownMenu.Separator,
} satisfies RteBaseComponents

export const FULLSCREEN_COMPONENTS = {
  Dialog: Dialog.Root,
  DialogContent: ({ overlayClassName, ...props }) => (
    <Dialog.Portal>
      <Dialog.Overlay className={overlayClassName} />
      <Dialog.Content {...props} />
    </Dialog.Portal>
  ),
  DialogTitle: Dialog.Title,
  DialogClose: Dialog.Close,
  // Radix has no button; a bare one, leaving out the styling props.
  Button: ({ variant: _variant, size: _size, ...props }) => (
    <button {...props} />
  ),
} satisfies RteFullscreenComponents

/** Every part, for an editor with full screen allowed. */
export const ALL_COMPONENTS = { ...BASE_COMPONENTS, ...FULLSCREEN_COMPONENTS }

/**
 * Renders the editor, with every part, and returns its live contenteditable
 * element.
 *
 * `before` and `after` render beside it, for a case that needs something else
 * on the page; `rerenderEditor` renders it again with new props.
 */
export const renderEditor = (
  props: Partial<EditorProps> = {},
  { before, after }: { before?: React.ReactNode; after?: React.ReactNode } = {}
): {
  editor: HTMLElement
  onChange: Mock<EditorProps['onChange']>
  rerenderEditor: (nextProps: Partial<EditorProps>) => void
} => {
  const onChange = vi.fn<EditorProps['onChange']>()
  const buildTree = (treeProps: Partial<EditorProps>) => (
    <>
      {before}
      <RichTextEditor
        {...(treeProps as EditorProps)}
        value={treeProps.value ?? null}
        onChange={onChange}
        components={ALL_COMPONENTS}
      />
      {after}
    </>
  )
  const { rerender } = render(buildTree(props))
  const editor = document.querySelector<HTMLElement>('[contenteditable="true"]')
  if (!editor) throw new Error('editor never rendered')
  return {
    editor,
    onChange,
    rerenderEditor: (nextProps: Partial<EditorProps>) =>
      rerender(buildTree(nextProps)),
  }
}
