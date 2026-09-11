// ============================================================================
// SEARCH BAR (Client Component)
// ============================================================================
// Same "URL as state" idea as TagFilter, plus a debounce: we don't want to
// push a new URL (and trigger a server re-render) on every single keystroke
// — that would feel janky and hammer the database. Instead we wait until
// the user pauses typing for 300ms before updating the URL.
// ============================================================================

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NOTE: `router`/`pathname`/`searchParams` are intentionally left out of
  // the dependency array below (see the eslint-disable comment right above
  // it) — including them would re-arm this effect (and its debounce timer)
  // on every URL change, even though those changes are the SIDE EFFECT of
  // this very effect running, not a new reason to run it again.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
      // 300ms is a common sweet spot: long enough to skip most in-progress
      // typing, short enough that the search still feels "live."
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search photos..."
      className="w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    />
  );
}
