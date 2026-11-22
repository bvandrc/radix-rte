/**
 * @fileoverview The rich text editor's toolbar button, shared by its plain
 * buttons and the ones that open a menu.
 */

import type { Editor } from '@tiptap/react'

import { cn } from '@/lib/cn'
import type { RteMenuComponents } from '@/lib/components'

/** Applied when a button's formatting is active at the cursor. */
export const ACTIVE_BUTTON_CLASSES =
  'bg-radix-rte-secondary/70 text-radix-rte-foreground'

export type ToolbarButtonProps = React.ComponentProps<'button'> & {
  /** Omit for buttons that toggle nothing, so `aria-pressed` stays off them. */
  isActive?: boolean
  label: string
}

export const ToolbarButton = ({
  isActive,
  label,
  className,
  ...props
}: ToolbarButtonProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={isActive}
    title={label}
    // Prevent the editor from losing focus (and collapsing the selection) on click.
    onMouseDown={(e) => e.preventDefault()}
    className={cn(
      'flex shrink-0 items-center justify-center rounded',
      'text-radix-rte-muted-foreground',
      'hover:bg-radix-rte-secondary/50 hover:text-radix-rte-foreground',
      // Sized for a finger on mobile, back to a compact row from md up.
      'size-9 [&_svg]:size-5 md:size-8 md:[&_svg]:size-4',
      isActive && ACTIVE_BUTTON_CLASSES,
      className
    )}
    {...props}
  />
)

/** What a toolbar button that opens a menu needs from the editor around it. */
export interface ToolbarMenuProps {
  editor: Editor
  /** The editor's outer element — clicks inside it keep the toolbar open. */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Called with whether the toolbar should stay open, since the menu takes focus. */
  onToolbarOpenChange: (isOpen: boolean) => void
  /** The host's parts the menu renders with. */
  components: RteMenuComponents
}
