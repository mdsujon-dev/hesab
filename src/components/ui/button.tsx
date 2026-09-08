"use client";

import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd";
import { EXPENSE, INCOME } from "@/components/providers/theme-provider";

/**
 * The app's single Button.
 *
 * Wraps antd's so every screen shares one set of sizes and intents, and so the
 * income/expense tints live in one place instead of being restyled inline on
 * each page.
 *
 * `tone` is about meaning, not colour: "income" and "expense" carry the same
 * green/red the amounts use, so an action reads the same as the number it
 * produces.
 */
export type ButtonTone = "default" | "primary" | "income" | "expense" | "quiet";

export type ButtonProps = Omit<AntButtonProps, "type"> & {
  tone?: ButtonTone;
  /** Kept for callers that still pass antd's `type` directly. */
  type?: AntButtonProps["type"];
};

export function Button({
  tone = "default",
  type,
  style,
  ...rest
}: ButtonProps) {
  if (tone === "primary") {
    return <AntButton type="primary" style={style} {...rest} />;
  }

  if (tone === "quiet") {
    return <AntButton type="text" style={style} {...rest} />;
  }

  if (tone === "income" || tone === "expense") {
    const color = tone === "income" ? INCOME : EXPENSE;
    return (
      <AntButton
        style={{
          color,
          borderColor: `${color}59`,
          background: `${color}12`,
          fontWeight: 600,
          ...style,
        }}
        {...rest}
      />
    );
  }

  return <AntButton type={type} style={style} {...rest} />;
}

export default Button;
