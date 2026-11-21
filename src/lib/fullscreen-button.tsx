/**
 * @fileoverview What a button toggling the editor's full screen spreads onto
 * itself: its label (as both its accessible name and its `title` tooltip), its
 * icon as `children`, and a press that leaves focus where it is.
 */

import { type LucideIcon, Maximize2, Minimize2 } from 'lucide-react'

const getBtnProps = (label: string, Icon: LucideIcon) =>
  ({
    'aria-label': label,
    title: label,
    // Taking focus here would bubble into a form field's own
    // scroll-into-view-on-focus handling (meant for actual text inputs, to
    // dodge the on-screen keyboard), or pull it out of the editor -- nothing
    // this button does needs it.
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
    children: <Icon />,
  }) satisfies React.ComponentProps<'button'>

/** Props for a `<button>` that enters full screen. */
export const ENTER_FULLSCREEN_BTN_PROPS = getBtnProps('Full screen', Maximize2)

/** Props for a `<button>` that leaves full screen. */
export const EXIT_FULLSCREEN_BTN_PROPS = getBtnProps(
  'Exit full screen',
  Minimize2
)
