import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/**
 * Optimistic route protection only — it checks for the presence of the session
 * cookie, nothing more. Real verification (signature, expiry, user status)
 * happens per request in `requireUser()`, as the Next.js docs recommend.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("session")?.value);
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Send the user back where they were headed after signing in.
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip API routes, Next internals, and anything that looks like a static
  // file (it has an extension). Without the extension rule, /logo.png was
  // being redirected to /login, and the image optimizer then choked on the
  // HTML it got back instead of a PNG.
  matcher: ["/((?!api|_next|offline|.*\.[a-zA-Z0-9]+$).*)"],
};
