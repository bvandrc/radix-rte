/** @fileoverview The rich text editor's formatting toolbar. */

import { Fragment, useEffect, useRef } from 'react'
import type { ChainedCommands } from '@tiptap/core'
import { BulletList, OrderedList } from '@tiptap/extension-list'
import { useEditorState } from '@tiptap/react'
import { mapValues } from 'es-toolkit'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  type LucideIcon,
  SquareCode,
  Strikethrough,
} from 'lucide-react'
import type { MultidimensionalReadonlyArray } from 'type-fest'

import { MARK, NODE } from '@/lib/constants'
import type { RteFeature, RteFeaturesResolved } from '@/lib/features'
import { ChecklistMenu } from './ChecklistMenu'
import { TableMenu } from './TableMenu'
import {
  ToolbarButton,
  type ToolbarButtonProps,
  type ToolbarMenuProps,
} from './ToolbarButton'

const ToolbarSeparator = () => (
  <div
    aria-hidden
    data-testid="radix-rte-toolbar-separator"
    className="mx-0.5 w-px shrink-0 self-stretch bg-radix-rte-divider md:mx-1.5"
  />
)

/** What the toolbar needs to render one plain button and track its state. */
type ToolbarPlainButtonSpec = Pick<ToolbarButtonProps, 'label'> & {
  testId: string
  Icon: LucideIcon
  /** The node or mark `isActive` checks for. */
  name: string
  toggle: (chain: ChainedCommands) => ChainedCommands
}

/** A button that renders itself, with a menu of its own. */
type ToolbarMenuButtonSpec = { Renderer: React.ComponentType<ToolbarMenuProps> }

type ToolbarButtonSpec = ToolbarPlainButtonSpec | ToolbarMenuButtonSpec

const isMenuButton = (
  button: ToolbarButtonSpec
): button is ToolbarMenuButtonSpec => 'Renderer' in button

/** Each feature's toolbar button: a plain one toggling the node or mark it names, or a menu. */
const BUTTONS = {
  bold: {
    label: 'Bold',
    testId: 'radix-rte-bold',
    Icon: Bold,
    name: MARK.BOLD,
    toggle: (chain) => chain.toggleBold(),
  },
  italic: {
    label: 'Italic',
    testId: 'radix-rte-italic',
    Icon: Italic,
    name: MARK.ITALIC,
    toggle: (chain) => chain.toggleItalic(),
  },
  strike: {
    label: 'Strikethrough',
    testId: 'radix-rte-strikethrough',
    Icon: Strikethrough,
    name: MARK.STRIKE,
    toggle: (chain) => chain.toggleStrike(),
  },
  bulletList: {
    label: 'Bullet list',
    testId: 'radix-rte-bullet-list',
    Icon: List,
    name: BulletList.name,
    toggle: (chain) => chain.toggleBulletList(),
  },
  orderedList: {
    label: 'Numbered list',
    testId: 'radix-rte-numbered-list',
    Icon: ListOrdered,
    name: OrderedList.name,
    toggle: (chain) => chain.toggleOrderedList(),
  },
  checklist: { Renderer: ChecklistMenu },
  codeBlock: {
    label: 'Code block',
    testId: 'radix-rte-code-block',
    Icon: SquareCode,
    name: NODE.CODE_BLOCK,
    toggle: (chain) => chain.toggleCodeBlock(),
  },
  table: { Renderer: TableMenu },
} satisfies Record<RteFeature, ToolbarButtonSpec>

/** Every control's feature, in toolbar order, grouped between separators. */
// TODO (low priority): some day allow groups and order to be configurable by the consumer
// TODO (low priority): some day allow list menu to be configurable as collapsible
const GROUPS = [
  ['bold', 'italic', 'strike'],
  ['bulletList', 'orderedList', 'checklist'],
  ['codeBlock'],
  ['table'],
] as const satisfies MultidimensionalReadonlyArray<RteFeature, 2>

/** `GROUPS` cut to the features that are on, leaving out any group with none. */
const getShownGroups = (features: RteFeaturesResolved) =>
  GROUPS.map((group) => group.filter((feature) => features[feature])).filter(
    (group) => group.length > 0
  )

export type ToolbarProps = Pick<
  ToolbarMenuProps,
  'editor' | 'containerRef' | 'onToolbarOpenChange' | 'components'
> & {
  /** Whether the collapsible wrapper around this toolbar is currently shown. */
  isOpen: boolean
  /** Which features' controls to show. */
  features: RteFeaturesResolved
  /** Pinned after the scrolling row of buttons, so it's reachable at any width. */
  pinned?: React.ReactNode
}

/**
 * The editor's formatting buttons, with the checklist and table menus, and
 * whatever's `pinned` at its end.
 */
export const Toolbar = ({
  editor,
  containerRef,
  onToolbarOpenChange,
  components,
  isOpen,
  features,
  pinned,
}: ToolbarProps) => {
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      // A menu tracks its own state, so it's never active here.
      mapValues(
        BUTTONS,
        (button: ToolbarButtonSpec) =>
          !isMenuButton(button) && e.isActive(button.name)
      ),
  })

  const chain = () => editor.chain().focus()

  // The buttons row scrolls rather than wraps (below), so it needs a scroll
  // position -- start it at the first buttons every time this reopens,
  // rather than wherever a prior open happened to leave it (observed
  // drifting there, seemingly from the collapsible wrapper's own height
  // transition interacting with the browser's scroll handling).
  const buttonsRowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isOpen) buttonsRowRef.current?.scrollTo({ left: 0 })
  }, [isOpen])

  const menuProps = {
    editor,
    containerRef,
    onToolbarOpenChange,
    components,
  } satisfies ToolbarMenuProps

  const renderButton = (feature: RteFeature) => {
    const button: ToolbarButtonSpec = BUTTONS[feature]
    if (isMenuButton(button)) {
      return <button.Renderer key={feature} {...menuProps} />
    }
    const { label, testId, Icon, toggle } = button
    return (
      <ToolbarButton
        key={feature}
        label={label}
        data-testid={testId}
        isActive={active[feature]}
        onClick={() => toggle(chain()).run()}>
        <Icon />
      </ToolbarButton>
    )
  }

  return (
    <div className="flex border-b border-radix-rte-divider">
      {/* The formatting controls scroll rather than wrap: at mobile button
          sizes they're wider than a phone, and a second row would push the
          text itself off-screen. */}
      <div
        ref={buttonsRowRef}
        className="flex flex-1 gap-0.5 overflow-x-auto px-1.5 py-1">
        {/* Separators fall between the groups left with a control in them,
            so turning a whole group's features off leaves no stray divider. */}
        {getShownGroups(features).map((group, i) => (
          <Fragment key={group.join()}>
            {i > 0 && <ToolbarSeparator />}
            {group.map(renderButton)}
          </Fragment>
        ))}
      </div>
      {pinned && (
        <div className="flex shrink-0 items-center border-l border-radix-rte-divider px-1.5 py-1">
          {pinned}
        </div>
      )}
    </div>
  )
}
