/**
 * @fileoverview The parts the editor takes from its host rather than drawing
 * itself, so it looks like the rest of the app: its frame, the parts its
 * toolbar menus render with, and those its full-screen dialog does.
 *
 * Each takes the props of the Radix part it stands for, so components built on
 * Radix (like shadcn's) fit as they are. On top of those, the menu item takes
 * a `label`, an `icon`, and a `variant`, the dialog content an
 * `overlayClassName`, and the button a `variant` and a `size`.
 */

import type { LucideIcon } from 'lucide-react'
import type { Dialog, DropdownMenu } from 'radix-ui'

/** A component that takes the props `T` does, and `Extra`'s on top. */
type ComponentLike<
  T extends React.ElementType,
  Extra extends object = object,
> = React.ComponentType<React.ComponentProps<T> & Extra>

/** The parts the toolbar's menus render with. */
export type RteMenuComponents = {
  DropdownMenu: ComponentLike<typeof DropdownMenu.Root>
  DropdownMenuTrigger: ComponentLike<typeof DropdownMenu.Trigger>
  /** Stacked above whatever the editor sits in, its full-screen dialog included. */
  DropdownMenuContent: ComponentLike<typeof DropdownMenu.Content>
  DropdownMenuItem: React.ComponentType<
    Omit<React.ComponentProps<typeof DropdownMenu.Item>, 'children'> & {
      label: React.ReactNode
      icon?: LucideIcon
      /** `destructive` for an item that deletes something. */
      variant?: 'default' | 'destructive'
    }
  >
  DropdownMenuCheckboxItem: ComponentLike<typeof DropdownMenu.CheckboxItem>
  DropdownMenuSeparator: ComponentLike<typeof DropdownMenu.Separator>
}

/** The parts every editor needs: its frame, and the parts its toolbar menus render with. */
export type RteBaseComponents = {
  /** The frame the editor's toolbar and text sit in, drawing its border, background, and focus ring. */
  Field: ComponentLike<'div'>
} & RteMenuComponents

/**
 * The parts the full-screen dialog renders with.
 *
 * Needed unless the editor's `allowFullscreen` is `false`.
 */
export type RteFullscreenComponents = {
  Dialog: ComponentLike<typeof Dialog.Root>
  /** Stacked above whatever the editor sits in, with no close button of its own: the editor renders one. */
  DialogContent: ComponentLike<
    typeof Dialog.Content,
    { overlayClassName?: string }
  >
  DialogTitle: ComponentLike<typeof Dialog.Title>
  DialogClose: ComponentLike<typeof Dialog.Close>
  /** The full-screen dialog's Save and close buttons, in shadcn's `variant` and `size` names. */
  Button: ComponentLike<
    'button',
    { variant?: 'outline' | 'ghost'; size?: 'sm' | 'icon' }
  >
}
