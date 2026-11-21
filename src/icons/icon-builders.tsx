/**
 * @fileoverview The builder that badges one Lucide icon with another in its
 * corner, still a `LucideIcon`.
 */

import { forwardRef, useId } from 'react'
import type { LucideIcon, LucideProps } from 'lucide-react'

/** Lucide draws every icon in a square viewBox this many units across. */
export const LUCIDE_VIEWBOX_SIZE = 24

export type BadgedIconOptions = {
  /** The badge's box, in the base icon's viewBox units -- 0.6 of it by default. */
  badgeSize?: number
  /** Passed to the badge, which draws with `absoluteStrokeWidth` unless told otherwise. */
  badgeProps?: Omit<LucideProps, 'ref'>
  displayName: string
}

/**
 * Wraps a Lucide icon with another badged on its bottom-right corner, cut out
 * of the icon beneath it.
 *
 * The result is one `<svg>` and a `LucideIcon`, so it drops in wherever one is
 * expected.
 */
export const buildBadgedIcon = (
  Icon: LucideIcon,
  Badge: LucideIcon,
  {
    // Not `0.6 *`, which floats to 14.399999999999999 in the rendered markup.
    badgeSize = (LUCIDE_VIEWBOX_SIZE * 3) / 5,
    badgeProps,
    displayName,
  }: BadgedIconOptions
): LucideIcon => {
  // The badge nests as an inner <svg>, flush with the bottom-right corner, its
  // inline size beating any `[&_svg]` sizing a caller puts on every <svg> it
  // holds.
  const badgeOffset = LUCIDE_VIEWBOX_SIZE - badgeSize
  const renderBadge = (props?: Omit<LucideProps, 'ref'>) => (
    <Badge
      x={badgeOffset}
      y={badgeOffset}
      size={badgeSize}
      style={{ width: badgeSize, height: badgeSize }}
      // Scaled down, the badge's strokes would thin out next to the icon's.
      absoluteStrokeWidth
      {...badgeProps}
      {...props}
    />
  )

  const Wrapped = forwardRef<SVGSVGElement, Omit<LucideProps, 'ref'>>(
    ({ children, ...props }, ref) => {
      const maskId = useId()
      return (
        <Icon ref={ref} mask={`url(#${maskId})`} {...props}>
          {/* Masks a band out around the badge, so the cutout shows whatever
              sits behind the icon rather than a painted disc. A mask on the
              root <svg> measures in CSS pixels rather than the viewBox, hence
              the bounding-box units scaled back to the viewBox. */}
          <mask id={maskId} maskContentUnits="objectBoundingBox">
            <g transform={`scale(${1 / LUCIDE_VIEWBOX_SIZE})`}>
              <rect
                width={LUCIDE_VIEWBOX_SIZE}
                height={LUCIDE_VIEWBOX_SIZE}
                fill="white"
              />
              {renderBadge({ color: 'black', strokeWidth: 6 })}
              {renderBadge({ color: 'white' })}
            </g>
          </mask>
          {renderBadge()}
          {children}
        </Icon>
      )
    }
  )
  Wrapped.displayName = displayName
  return Wrapped
}
