/**
 * @fileoverview The full-screen dialog the rich text editor moves into, built
 * from its host's dialog and button components.
 */

import { useEffect, useState } from 'react'
import { useIsMobile, useVisualViewportPin } from '@bvandrc/react-toolkit'
import type { Editor } from '@tiptap/react'
import { Check } from 'lucide-react'

import { cn } from './lib/cn'
import type { RteFullscreenComponents } from './lib/components'
import { EXIT_FULLSCREEN_BTN_PROPS } from './lib/fullscreen-button'

export type RteFullscreenDialogProps = {
  editor: Editor
  /** The dialog's title. */
  label: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  /** The dialog's content element, kept matched to the mobile visual viewport while it's open. */
  contentRef: React.RefObject<HTMLDivElement | null>
  components: RteFullscreenComponents
  /**
   * Shown next to the full-screen close button when set, so a long edit in
   * there can be backed up without leaving it. Omit to not show one.
   * Resolves to whether the save succeeded, so the button only reads
   * "Saved" once it actually has.
   */
  onSave?: () => Promise<boolean>
  children: React.ReactNode
}

/** The full-screen dialog the editor moves into, focused at the end of its content on open, and back where it was on close. */
export const RteFullscreenDialog = ({
  editor,
  label,
  isOpen,
  onOpenChange,
  contentRef,
  components: { Dialog, DialogContent, DialogTitle, DialogClose, Button },
  children,
  onSave,
}: RteFullscreenDialogProps) => {
  // Keeps the dialog matched to the mobile visual viewport -- otherwise the
  // keyboard opening (or a pinch zoom) leaves this `fixed inset-0` dialog
  // covering, or covered by, more than it should.
  const isMobile = useIsMobile()
  const setContentRef = useVisualViewportPin(contentRef, isOpen && isMobile)
  const [justSaved, setJustSaved] = useState(false)

  // Reverts to "Save" the moment the saved content is edited again, rather
  // than on a timer.
  useEffect(() => {
    if (!justSaved) return
    const onUpdate = () => setJustSaved(false)
    editor.on('update', onUpdate)
    return () => void editor.off('update', onUpdate)
  }, [editor, justSaved])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        ref={setContentRef}
        data-testid="radix-rte-fullscreen-dialog"
        // The title alone describes this; Radix warns unless the missing
        // description is opted out of explicitly.
        aria-describedby={undefined}
        className={cn(
          'flex flex-col gap-0 p-0',
          // Zero-length close animation: the editor returns to the inline
          // field the moment this closes, so a lingering exit would leave
          // an empty shell fading over the form.
          'data-[state=closed]:duration-0',
          // Full screen on mobile, matching `useIsMobile`'s breakpoint, edge to
          // edge without the dialog's own rounding or border.
          'inset-0 h-full w-full max-w-none translate-x-0 translate-y-0',
          'max-md:rounded-none max-md:border-0',
          // A host dialog that rounds from `sm` up (shadcn's does) would
          // otherwise win between `sm` and `md`, so match its breakpoint too.
          'sm:max-md:rounded-none',
          // From there up, a true full-screen dialog reads as too much empty
          // space, so it's slightly inset from the window instead, rounded and
          // bordered however the host's dialogs are.
          'md:inset-x-32 md:inset-y-8 md:h-auto md:w-auto'
        )}
        // Matches the content's own zero-length close animation above.
        overlayClassName="data-[state=closed]:duration-0"
        // Radix would park focus on the dialog itself; the point of opening
        // it is to keep writing.
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          // 'end' rather than the default start, so opening full screen to
          // keep writing lands after the existing content, not before it.
          // Any page scroll this focus causes on mobile (to bring the caret
          // above the opening keyboard) is undone by the viewport pin above.
          editor.commands.focus('end')
        }}
        // Closing remounts the inline `EditorContent`, which drops the caret,
        // and Radix would hand focus back to whatever had it on open -- put
        // the caret back instead, so typing carries on where it left off.
        onCloseAutoFocus={(e) => {
          // Radix calls this a tick after closing, by when the whole field
          // may have unmounted with it -- destroyed, or (Tiptap destroys on a
          // timer of its own) not yet but off the page.
          if (editor.isDestroyed || !editor.view.dom.isConnected) return
          e.preventDefault()
          editor.commands.focus()
        }}>
        <div className="flex items-center justify-between border-b border-radix-rte-divider px-4 py-2">
          <DialogTitle className="text-base">{label}</DialogTitle>
          <div className="flex items-center gap-2">
            {onSave && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void onSave().then((didSave) => setJustSaved(didSave))
                }}
                data-testid="radix-rte-fullscreen-save">
                {justSaved ? (
                  <>
                    Saved
                    <Check className="size-4" />
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            )}
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                {...EXIT_FULLSCREEN_BTN_PROPS}
                data-testid="radix-rte-fullscreen-close"
              />
            </DialogClose>
          </div>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  )
}
