"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function MonthPicker({
  defaultYear,
  defaultMonth,
}: {
  defaultYear: number;
  defaultMonth: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentYear = Number(searchParams.get("year")) || defaultYear;
  const currentMonth = Number(searchParams.get("month")) || defaultMonth;

  const years = Array.from({ length: 5 }, (_, i) => defaultYear - i);

  function update(y: number, m: number) {
    const params = new URLSearchParams();
    params.set("year", String(y));
    params.set("month", String(m));
    router.push(`${pathname}?${params.toString()}`);
  }

  function shift(delta: number) {
    let y = currentYear;
    let m = currentMonth + delta;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    update(y, m);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button className="btn btn-sm" onClick={() => shift(-1)} type="button">
        ←
      </button>
      <select
        className="select"
        value={currentYear}
        onChange={(e) => update(Number(e.target.value), currentMonth)}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y} 年
          </option>
        ))}
      </select>
      <select
        className="select"
        value={currentMonth}
        onChange={(e) => update(currentYear, Number(e.target.value))}
      >
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {m} 月
          </option>
        ))}
      </select>
      <button className="btn btn-sm" onClick={() => shift(1)} type="button">
        →
      </button>
      <button
        className="btn btn-sm btn-ghost"
        onClick={() => {
          const now = new Date();
          update(now.getFullYear(), now.getMonth() + 1);
        }}
        type="button"
      >
        本月
      </button>
    </div>
  );
}
