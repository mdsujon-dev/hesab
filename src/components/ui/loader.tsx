"use client";

import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

/**
 * Deliberately small loading affordances.
 *
 * Full-page skeletons make every navigation feel like a cold start, which is
 * wrong for an app whose data is already on the device — most "loading" here
 * lasts a few hundred milliseconds.
 */
export function MiniLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm opacity-60">
      <Spin indicator={<LoadingOutlined spin style={{ fontSize: 16 }} />} />
      {label ? <span>{label}</span> : null}
    </div>
  );
}

/** Inline spinner for toolbars and card headers. */
export function InlineSpinner({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <Spin
      indicator={<LoadingOutlined spin style={{ fontSize: 14 }} />}
      className="opacity-70"
    />
  );
}

/**
 * Thin progress line pinned to the top of a container. Signals "working"
 * without moving any layout.
 */
export function TopProgress({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-t"
    >
      <div
        className="h-full w-1/3"
        style={{
          background:
            "linear-gradient(90deg, transparent, #d4af37, transparent)",
          animation: "slide 1.1s ease-in-out infinite",
        }}
      />
      <style>{`@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}
