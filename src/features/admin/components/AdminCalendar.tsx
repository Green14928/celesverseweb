"use client";

import Link from "next/link";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { LegendItem } from "./EditableLegend";

export interface CalendarCourse {
  id: string;
  title: string;
  startDate: string | null; // ISO
  endDate: string | null;
  isPublished: boolean;
  categoryName?: string | null;
  calendarColor?: string | null;
  teacherName?: string | null;
  price?: number;
  filled?: number;
  total?: number;
}

const MONTHS_ZH = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

const DOW = [
  { k: "週日", cls: "sun" },
  { k: "週一", cls: "" },
  { k: "週二", cls: "" },
  { k: "週三", cls: "" },
  { k: "週四", cls: "" },
  { k: "週五", cls: "" },
  { k: "週六", cls: "sat" },
];

const DEFAULT_COLOR = "#c5956b";

function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const cells: Date[] = [];
  const start = new Date(year, month, 1 - startOffset);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

const fmt = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function courseOnDay(c: CalendarCourse, ds: string): boolean {
  if (!c.startDate) return false;
  const start = c.startDate.slice(0, 10);
  const end = (c.endDate ?? c.startDate).slice(0, 10);
  return ds >= start && ds <= end;
}

function hourLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return "";
  const isAM = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mins = m === 0 ? "" : `:${String(m).padStart(2, "0")}`;
  return `${isAM ? "上午" : "下午"} ${h12}${mins}`;
}

interface AdminCalendarProps {
  courses: CalendarCourse[];
  legendItems: LegendItem[];
}

export function AdminCalendar({ courses, legendItems }: AdminCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [{ year, month }, setYM] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [popover, setPopover] = useState<{
    course: CalendarCourse;
    x: number;
    y: number;
  } | null>(null);

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarCourse[]> = {};
    cells.forEach((d) => {
      map[fmt(d)] = courses.filter((c) => courseOnDay(c, fmt(d)));
    });
    return map;
  }, [cells, courses]);

  const colorByCategory = useMemo(() => {
    const m = new Map<string, string>();
    legendItems.forEach((it) => {
      if (it.editable !== false && it.label) m.set(it.label, it.color);
    });
    return m;
  }, [legendItems]);

  const getCourseColor = useCallback(
    (c: CalendarCourse): string => {
      if (c.calendarColor) return c.calendarColor;
      if (c.categoryName && colorByCategory.has(c.categoryName)) {
        return colorByCategory.get(c.categoryName)!;
      }
      return DEFAULT_COLOR;
    },
    [colorByCategory],
  );

  const focusedCourse = courses.find(
    (c) => c.id === (selectedCourseId || hoveredCourseId),
  );
  const isDimmed = (ds: string): boolean =>
    focusedCourse ? !courseOnDay(focusedCourse, ds) : false;

  const goPrev = () =>
    setYM((prev) => ({
      year: prev.month === 0 ? prev.year - 1 : prev.year,
      month: prev.month === 0 ? 11 : prev.month - 1,
    }));
  const goNext = () =>
    setYM((prev) => ({
      year: prev.month === 11 ? prev.year + 1 : prev.year,
      month: prev.month === 11 ? 0 : prev.month + 1,
    }));
  const goToday = () =>
    setYM({ year: today.getFullYear(), month: today.getMonth() });

  const cellsRef = useRef<HTMLDivElement>(null);

  const handleChipClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, course: CalendarCourse) => {
      e.stopPropagation();
      setSelectedCourseId((prev) => (prev === course.id ? null : course.id));
      if (!cellsRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const container = cellsRef.current.getBoundingClientRect();
      setPopover({
        course,
        x: rect.left - container.left,
        y: rect.bottom - container.top + 6,
      });
    },
    [],
  );

  useEffect(() => {
    if (!selectedCourseId) setPopover(null);
  }, [selectedCourseId]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest) return;
      if (t.closest(".cal-chip") || t.closest(".popover")) return;
      setPopover(null);
      setSelectedCourseId(null);
    };
    const id = window.setTimeout(
      () => document.addEventListener("mousedown", onDocDown),
      0,
    );
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDocDown);
    };
  }, []);

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-head-left">
          <div className="cal-nav">
            <button className="nav-btn" onClick={goPrev} type="button">
              ‹
            </button>
            <button className="nav-btn" onClick={goNext} type="button">
              ›
            </button>
            <button className="today-btn" onClick={goToday} type="button">
              今日
            </button>
          </div>
          <div className="cal-month-title">
            <span className="yr">{year}</span>
            {MONTHS_ZH[month]}
          </div>
        </div>
        <div className="view-toggle">
          <button className="on" type="button">
            月
          </button>
        </div>
      </div>

      <div style={{ position: "relative" }} ref={cellsRef}>
        <div className="cal">
          {DOW.map((d) => (
            <div key={d.k} className={`cal-dow ${d.cls}`}>
              {d.k}
            </div>
          ))}
          {cells.map((d, i) => {
            const ds = fmt(d);
            const inMonth = d.getMonth() === month;
            const isToday = sameDay(d, today);
            const isSelected = selectedDay === ds;
            const events = eventsByDay[ds] || [];
            const dim = isDimmed(ds);
            const classes = [
              "cal-cell",
              !inMonth && "other",
              isToday && "today",
              isSelected && "selected",
              dim && "dim",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                key={i}
                className={classes}
                onClick={() =>
                  setSelectedDay((prev) => (prev === ds ? null : ds))
                }
              >
                <div className="cal-date">{d.getDate()}日</div>
                {events.slice(0, 3).map((c) => {
                  const color = getCourseColor(c);
                  const isHl = focusedCourse?.id === c.id;
                  const label = hourLabel(c.startDate);
                  return (
                    <div
                      key={c.id}
                      className={`cal-chip ${isHl ? "hl" : ""} ${!c.isPublished ? "unpublished" : ""}`}
                      style={{ borderLeftColor: color }}
                      onMouseEnter={() => setHoveredCourseId(c.id)}
                      onMouseLeave={() => setHoveredCourseId(null)}
                      onClick={(e) => handleChipClick(e, c)}
                      title={c.title}
                    >
                      <span
                        className="dot"
                        style={{ background: isHl ? undefined : color }}
                      />
                      {label && <span className="t">{label}</span>}
                      <span className="n">{c.title}</span>
                    </div>
                  );
                })}
                {events.length > 3 && (
                  <div className="cal-more">+{events.length - 3} 堂</div>
                )}
              </div>
            );
          })}
        </div>

        {popover && (
          <CoursePopover
            course={popover.course}
            x={popover.x}
            y={popover.y}
            color={getCourseColor(popover.course)}
            categoryLabel={popover.course.categoryName ?? ""}
            onClose={() => {
              setPopover(null);
              setSelectedCourseId(null);
            }}
          />
        )}
      </div>

      <div className="cal-legend">
        {legendItems.map((item) => (
          <div key={item.key} className="lg">
            <span className="dot" style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="spacer" />
        <div className="hint">點擊日期篩選課程 · 點擊課程查看詳情</div>
      </div>
    </div>
  );
}

interface CoursePopoverProps {
  course: CalendarCourse;
  x: number;
  y: number;
  color: string;
  categoryLabel: string;
  onClose: () => void;
}

function CoursePopover({
  course,
  x,
  y,
  color,
  categoryLabel,
  onClose,
}: CoursePopoverProps) {
  const start = course.startDate?.slice(0, 10) ?? "—";
  const end = course.endDate?.slice(0, 10);
  const dateText = end && end !== start ? `${start} ~ ${end}` : start;

  return (
    <div className="popover" style={{ left: Math.min(x, 700), top: y }}>
      <div className="pv-title">{course.title}</div>
      <div className="pv-meta">
        {categoryLabel && (
          <span
            className="cat-tag"
            style={{ background: `${color}1a`, color }}
          >
            {categoryLabel}
          </span>
        )}
        {course.teacherName && <span>· {course.teacherName} 老師</span>}
        {!course.isPublished && (
          <span style={{ color: "var(--admin-text-muted)" }}>· 未上架</span>
        )}
      </div>
      <div className="pv-row">
        <span className="k">日期</span>
        <span className="v">{dateText}</span>
      </div>
      {typeof course.filled === "number" &&
        typeof course.total === "number" && (
          <div className="pv-row">
            <span className="k">報名</span>
            <span className="v">
              {course.filled} / {course.total}
            </span>
          </div>
        )}
      {typeof course.price === "number" && (
        <div className="pv-row">
          <span className="k">價格</span>
          <span className="v">NT$ {course.price.toLocaleString()}</span>
        </div>
      )}
      <div className="pv-actions">
        <Link
          href={`/admin/courses/${course.id}`}
          className="op-btn"
          style={{ textDecoration: "none" }}
        >
          查看詳情
        </Link>
        <Link
          href={`/admin/courses/${course.id}/edit`}
          className="op-btn"
          style={{ textDecoration: "none" }}
        >
          編輯
        </Link>
        <div style={{ flex: 1 }} />
        <button className="op-btn" type="button" onClick={onClose}>
          關閉
        </button>
      </div>
    </div>
  );
}
