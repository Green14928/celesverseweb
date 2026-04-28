// 管理後台 — 課程行事曆 + 課程列表
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { AdminCalendar } from "@/features/admin/components/AdminCalendar";
import { getCalendarLegend } from "@/features/admin/actions/site-content.action";
import { TogglePublishButton } from "@/features/admin/components/TogglePublishButton";
import { CourseActionsMenu } from "@/features/admin/components/CourseActionsMenu";
import { CourseListFilters } from "@/features/admin/components/CourseListFilters";
import type { LegendItem } from "@/features/admin/components/EditableLegend";

export const dynamic = "force-dynamic";

const DEFAULT_COLORS = [
  "#7d9e6a",
  "#9c7fb8",
  "#c5956b",
  "#6a8ea3",
  "#2a3349",
  "#b88a4a",
  "#c0564b",
  "#8a8471",
];

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

type RegStatus = "draft" | "full" | "hot" | "open";

function regStatus(isPublished: boolean, filled: number, total: number): RegStatus {
  if (!isPublished) return "draft";
  if (total > 0 && filled >= total) return "full";
  if (total > 0 && filled / total >= 0.8) return "hot";
  return "open";
}

const REG_LABEL: Record<RegStatus, string> = {
  draft: "草稿",
  full: "額滿",
  hot: "熱報",
  open: "報名中",
};

function timeLabel(iso: Date | null): string {
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    cy?: string;
    cm?: string;
    q?: string;
  }>;
}) {
  const { tab = "active", cy, cm, q } = await searchParams;

  const [allCourses, categories, savedLegend] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        templateId: true,
        template: {
          select: {
            title: true,
            category: { select: { name: true } },
          },
        },
        startDate: true,
        endDate: true,
        isPublished: true,
        isPostponed: true,
        postponedTo: true,
        postponedNote: true,
        calendarColor: true,
        price: true,
        totalSlots: true,
        soldCount: true,
        teacher: { select: { name: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getCalendarLegend(),
  ]);

  // Calendar data
  const calendarCourses = allCourses.map((c) => ({
    id: c.id,
    title: c.template.title,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    isPublished: c.isPublished,
    categoryName: c.template.category?.name ?? null,
    calendarColor: c.calendarColor ?? null,
    teacherName: c.teacher?.name ?? null,
    price: c.price,
    filled: c.soldCount,
    total: c.totalSlots,
  }));

  // Legend
  let legendItems: LegendItem[];
  if (savedLegend && savedLegend.length > 0) {
    legendItems = savedLegend.map((item) => ({ ...item, editable: true }));
  } else {
    legendItems = categories.map((cat, i) => ({
      key: cat.name,
      label: cat.name,
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      editable: true,
    }));
  }
  legendItems.push({
    key: "_unpublished",
    label: "未上架",
    color: "#b0a998",
    editable: false,
  });

  const colorByCategory = new Map<string, string>();
  legendItems.forEach((it) => {
    if (it.editable !== false && it.label) colorByCategory.set(it.label, it.color);
  });
  function courseColor(
    c: (typeof allCourses)[number],
  ): string {
    if (c.calendarColor) return c.calendarColor;
    if (c.template.category?.name) {
      return (
        colorByCategory.get(c.template.category.name) ?? "#c5956b"
      );
    }
    return "#c5956b";
  }

  // Filters
  const statusFilter = tab;
  const courseStatus = (c: (typeof allCourses)[number]) =>
    regStatus(c.isPublished, c.soldCount, c.totalSlots);

  let filteredCourses = allCourses;
  if (statusFilter === "active") {
    filteredCourses = allCourses.filter((c) => {
      const s = courseStatus(c);
      return s !== "full";
    });
  } else if (statusFilter === "completed") {
    filteredCourses = allCourses.filter((c) => courseStatus(c) === "full");
  }

  if (cy && cm && !isNaN(Number(cy)) && !isNaN(Number(cm))) {
    const y = Number(cy);
    const m = Number(cm);
    if (y > 2000 && m >= 1 && m <= 12) {
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 1);
      filteredCourses = filteredCourses.filter((c) => {
        if (!c.startDate) return false;
        const start = new Date(c.startDate);
        const end = c.endDate ? new Date(c.endDate) : start;
        return start < monthEnd && end >= monthStart;
      });
    }
  }

  if (q) {
    const lq = q.toLowerCase();
    filteredCourses = filteredCourses.filter(
      (c) =>
        c.template.title.toLowerCase().includes(lq) ||
        (c.teacher?.name ?? "").toLowerCase().includes(lq),
    );
  }

  // Stat strip values (for current month only, to mirror handoff)
  const now = new Date();
  const monthCourses = allCourses.filter((c) => {
    if (!c.startDate) return false;
    const d = new Date(c.startDate);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });
  const publishedCount = monthCourses.filter((c) => c.isPublished).length;
  const totalCap = monthCourses.reduce((s, c) => s + c.totalSlots, 0) || 1;
  const totalFilled = monthCourses.reduce((s, c) => s + c.soldCount, 0);
  const fillRate = Math.round((totalFilled / totalCap) * 100);
  const revenue = monthCourses.reduce(
    (s, c) => s + c.price * c.soldCount,
    0,
  );
  const teacherIds = new Set(
    allCourses.map((c) => c.teacher?.name).filter(Boolean),
  );

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>內容</span>
          <span className="sep">/</span>
          <span className="here">課程管理</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">課程管理</h1>
          <div className="page-sub">Courses</div>
        </div>
        <div className="page-actions">
          <Link href="/admin/courses/new" className="btn btn-primary">
            + 新增課程
          </Link>
        </div>
      </div>

      {/* Stat strip */}
      <div className="stat-strip with-intro">
        <div className="stat-intro">
          <div className="cycle">THIS MONTH</div>
          <div className="cycle-name">
            {now.getFullYear()} · {MONTHS_ZH[now.getMonth()]}
          </div>
          <div className="cycle-hint">
            本月共 {monthCourses.length} 堂課程 · {teacherIds.size} 位講師在線
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">本月課程</div>
          <div className="stat-value">
            {monthCourses.length}
            <span className="unit">堂</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">已上架</div>
          <div className="stat-value">
            {publishedCount}
            <span className="unit">/ {monthCourses.length || 0}</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">報名率</div>
          <div className="stat-value">
            {monthCourses.length ? fillRate : 0}
            <span className="unit">%</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">預估營收</div>
          <div className="stat-value">
            <span className="unit" style={{ marginLeft: 0, marginRight: 4 }}>
              NT$
            </span>
            {revenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <AdminCalendar courses={calendarCourses} legendItems={legendItems} />

      {/* 課程列表 */}
      <div className="course-list-section">
        <div className="panel-head">
          <div className="panel-head-left">
            <h3 className="panel-title">課程列表</h3>
            <span className="panel-en">
              COURSE ROSTER · {now.getFullYear()}.
              {String(now.getMonth() + 1).padStart(2, "0")}
            </span>
          </div>
          <Link href="/admin/courses/new" className="btn btn-accent btn-sm">
            + 新增課程
          </Link>
        </div>

        <div className="filter-row">
          <Suspense>
            <CourseListFilters />
          </Suspense>
          <div className="filter-spacer" />
          <div className="filter-count">
            共<span className="num">{filteredCourses.length}</span>門課程
          </div>
        </div>

        <div className="course-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>課程名稱</th>
                <th>分類</th>
                <th style={{ minWidth: 88 }}>講師</th>
                <th>日期</th>
                <th style={{ width: 72 }}>報名</th>
                <th>價格</th>
                <th>上架</th>
                <th>課程狀態</th>
                <th style={{ width: 72, textAlign: "right" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--admin-text-muted)",
                      fontSize: 12,
                    }}
                  >
                    此條件下尚無課程
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const remaining = course.totalSlots - course.soldCount;
                  const pct =
                    course.totalSlots > 0
                      ? Math.round((course.soldCount / course.totalSlots) * 100)
                      : 0;
                  const capClass =
                    course.soldCount >= course.totalSlots && course.totalSlots > 0
                      ? "full"
                      : pct >= 80
                        ? "hot"
                        : "";
                  const status = courseStatus(course);
                  const color = courseColor(course);
                  const teacher = course.teacher?.name ?? null;
                  const tLabel = timeLabel(course.startDate);
                  const start = course.startDate
                    ? new Date(course.startDate).toISOString().slice(0, 10)
                    : null;
                  const end = course.endDate
                    ? new Date(course.endDate).toISOString().slice(0, 10)
                    : null;
                  const range = !start
                    ? "—"
                    : !end || end === start
                      ? start.replace(/-/g, "/")
                      : `${start.slice(5).replace("-", "/")} ~ ${end.slice(5).replace("-", "/")}`;
                  return (
                    <tr key={course.id}>
                      <td>
                        <div className="course-name">
                          <span className="dot" style={{ background: color }} />
                          <div>
                            <Link
                              href={`/admin/courses/${course.id}`}
                              className="title link"
                            >
                              {course.template.title}
                            </Link>
                            {course.isPostponed && (
                              <div className="meta">
                                POSTPONED
                                {course.postponedTo &&
                                  ` · 延至 ${new Date(course.postponedTo).toLocaleDateString("zh-TW")}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {course.template.category ? (
                          <span
                            className="cat-tag"
                            style={{
                              background: `${color}1a`,
                              color,
                            }}
                          >
                            {course.template.category.name}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={teacher ? "teacher-name" : "teacher-name muted"}
                        >
                          {teacher ?? "— 未指派"}
                        </span>
                      </td>
                      <td>
                        <div className="date-cell">
                          <div className="range">{range}</div>
                          {tLabel && <div className="time">{tLabel}</div>}
                          {course.isPostponed &&
                            course.postponedTo && (
                              <div className="postponed">
                                延至{" "}
                                {new Date(
                                  course.postponedTo,
                                ).toLocaleDateString("zh-TW")}
                                {course.postponedNote && (
                                  <span className="muted">
                                    {" "}
                                    · {course.postponedNote}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                      </td>
                      <td>
                        <div className={`capacity ${capClass}`}>
                          <div className="nums">
                            <span className="filled">{course.soldCount}</span>
                            <span className="slash">/</span>
                            <span className="total">{course.totalSlots}</span>
                          </div>
                          <div className="bar">
                            <span
                              style={{ width: `${Math.max(pct, 3)}%` }}
                            />
                          </div>
                          {remaining > 0 && remaining <= 3 && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--admin-red)",
                              }}
                            >
                              剩 {remaining}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="price">
                          <span className="cur">NT$</span>
                          {course.price.toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <TogglePublishButton
                          courseId={course.id}
                          isPublished={course.isPublished}
                        />
                      </td>
                      <td>
                        <span className={`reg-status ${status}`}>
                          <span className="sd" />
                          {REG_LABEL[status]}
                        </span>
                      </td>
                      <td>
                        <div className="ops course-ops">
                          <CourseActionsMenu
                            courseId={course.id}
                            courseName={course.template.title}
                            isPostponed={course.isPostponed}
                            postponedTo={
                              course.postponedTo
                                ? course.postponedTo
                                    .toISOString()
                                    .split("T")[0]
                                : null
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
