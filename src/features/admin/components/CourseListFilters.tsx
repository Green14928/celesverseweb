"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";

const TABS = [
  { key: "active", label: "進行中 / 未開始" },
  { key: "completed", label: "已完成" },
  { key: "all", label: "全部" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function CourseListFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTab = searchParams.get("tab") || "active";
  const currentYear = searchParams.get("cy") || "";
  const currentMonth = searchParams.get("cm") || "";
  const currentSearch = searchParams.get("q") || "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => updateParams({ q: value.trim() }),
      300,
    );
  }

  return (
    <>
      <div className="filter-pills">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => updateParams({ tab: tab.key })}
            className={currentTab === tab.key ? "on" : ""}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <select
        className="select"
        value={currentYear}
        onChange={(e) => {
          const y = e.target.value;
          if (y && !currentMonth) {
            updateParams({ cy: y, cm: String(new Date().getMonth() + 1) });
          } else {
            updateParams({ cy: y });
          }
        }}
      >
        <option value="">全部年份</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y} 年
          </option>
        ))}
      </select>

      <select
        className="select"
        value={currentMonth}
        onChange={(e) => {
          const m = e.target.value;
          if (m && !currentYear) {
            updateParams({ cm: m, cy: String(CURRENT_YEAR) });
          } else {
            updateParams({ cm: m });
          }
        }}
      >
        <option value="">全部月份</option>
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {m} 月
          </option>
        ))}
      </select>

      <input
        className="search-input"
        defaultValue={currentSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="搜尋課程或講師"
        style={{ width: 200 }}
      />

      {(currentYear || currentMonth || currentSearch) && (
        <button
          type="button"
          onClick={() => updateParams({ cy: "", cm: "", q: "" })}
          className="btn btn-ghost btn-sm"
        >
          清除
        </button>
      )}
    </>
  );
}
