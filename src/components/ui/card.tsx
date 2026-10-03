"use client";

import { Card as AntCard } from "antd";
import type { CardProps as AntCardProps } from "antd";

/**
 * The app's single Card.
 *
 * Every surface — filter bars, stat tiles, charts, tables — uses this, so the
 * border, radius and lift are defined once instead of drifting per screen.
 * Separation comes from the border; the shadow is only a hint, so a page full
 * of cards reads as one plane rather than a stack of floating slabs.
 */
export type CardProps = AntCardProps & {
  /** Tighter padding for dense surfaces such as filter toolbars. */
  compact?: boolean;
  /** Drops the body padding to nothing — used when a table fills the card. */
  flush?: boolean;
};

export function Card({
  compact = false,
  flush = false,
  styles,
  ...rest
}: CardProps) {
  const bodyPadding = flush ? 0 : compact ? 12 : 18;

  // antd 6 allows `styles` to be a function of the props; only an object can
  // be merged into, so a caller-supplied function is passed straight through.
  const merged =
    typeof styles === "function"
      ? styles
      : {
          ...styles,
          body: { padding: bodyPadding, ...styles?.body },
          header: { minHeight: 48, ...styles?.header },
        };

  return <AntCard variant="outlined" {...rest} styles={merged} />;
}

export default Card;
