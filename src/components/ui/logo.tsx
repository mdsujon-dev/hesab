import Image from "next/image";

/**
 * The brand mark from `public/logo.png`.
 *
 * The source file carries a lot of transparent padding around the artwork, so
 * the visible wordmark is noticeably smaller than the box it is given — these
 * heights are set against how the mark actually reads, not the file's bounds.
 *
 * It is a wide wordmark (roughly 3:1), so it is sized by height and the width
 * follows; dropping it into a square slot would letterbox it.
 */
export function Logo({
  height = 44,
  priority = false,
  className = "",
}: {
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  // Request at 3x so the bitmap stays crisp on high-DPI screens.
  const renderWidth = Math.round(height * 3);

  return (
    <Image
      src="/logo.png"
      alt="Hesab"
      width={renderWidth * 3}
      height={height * 3}
      priority={priority}
      className={className}
      style={{ height, width: "auto", objectFit: "contain" }}
    />
  );
}

/** Square icon form, for tight slots like a collapsed sidebar. */
export function LogoMark({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/icons/icon-192.png"
      alt="Hesab"
      width={size * 2}
      height={size * 2}
      className={`rounded-lg ${className}`}
      style={{ height: size, width: size }}
    />
  );
}
