import type { ReactNode } from "react";

/**
 * The row above a list: search on the left, filters on the right.
 *
 * One shape for every table, because a search box that moves depending on how
 * many filters a page happens to have is a search box people have to look for.
 * Searching is what you do first and most often, so it gets the corner the eye
 * starts from; the filters are the narrowing you reach for afterwards.
 *
 * The empty span is deliberate — it keeps `justify-between` pushing the filters
 * to the right on a page that has no search at all.
 */
const ListToolbar = ({
  search,
  children,
  className = "",
}: {
  search?: ReactNode;
  children?: ReactNode;
  className?: string;
}) => (
  <div
    className={`mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${className}`}
  >
    {search ? <div className="w-full sm:w-64">{search}</div> : <span />}
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

export default ListToolbar;
