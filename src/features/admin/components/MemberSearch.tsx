"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef } from "react";

export function MemberSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = searchParams.get("q") ?? "";

  function update(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update(value.trim()), 300);
  }

  return (
    <input
      className="search-input"
      defaultValue={current}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="搜尋姓名、Email、電話…"
      style={{ minWidth: 260 }}
    />
  );
}
