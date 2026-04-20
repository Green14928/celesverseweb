"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSearch = searchParams.get("search") || "";
  const currentYear = searchParams.get("year") || "";
  const currentMonth = searchParams.get("month") || "";
  const hasDateFilter = currentYear !== "" && currentMonth !== "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value.trim() });
    }, 300);
  }

  function applyDateFilter(year: string, month: string) {
    if (year && month) {
      updateParams({ year, month });
    }
  }

  function clearDateFilter() {
    updateParams({ year: "", month: "" });
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (hasDateFilter) {
      params.set(
        "month",
        `${currentYear}-${String(Number(currentMonth)).padStart(2, "0")}`,
      );
    }
    window.open(`/api/orders/export?${params.toString()}`, "_blank");
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <input
        className="search-input"
        defaultValue={currentSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="搜尋訂單編號、會員姓名、Email、電話…"
        style={{ minWidth: 260 }}
      />

      <select
        className="select"
        value={currentYear}
        onChange={(e) => {
          const y = e.target.value;
          if (y) {
            applyDateFilter(
              y,
              currentMonth ||
                String(
                  CURRENT_YEAR === Number(y)
                    ? new Date().getMonth() + 1
                    : 1,
                ),
            );
          } else {
            clearDateFilter();
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
          if (m) {
            applyDateFilter(currentYear || String(CURRENT_YEAR), m);
          } else {
            clearDateFilter();
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

      {hasDateFilter && (
        <button
          onClick={clearDateFilter}
          className="btn btn-ghost btn-sm"
          type="button"
        >
          清除日期
        </button>
      )}

      <button onClick={handleExport} className="btn btn-sm" type="button">
        匯出 CSV
      </button>
    </div>
  );
}
