// 管理後台 — 老師月度課務統計
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MonthPicker } from "@/features/admin/components/MonthPicker";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function TeacherStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { id } = await params;
  const { year, month } = await searchParams;

  const now = new Date();
  const y = Number(year) || now.getFullYear();
  const m = Number(month) || now.getMonth() + 1;

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) notFound();

  const startOfMonth = new Date(y, m - 1, 1);
  const startOfNext = new Date(y, m, 1);

  const courses = await prisma.course.findMany({
    where: {
      teacherId: id,
      startDate: { gte: startOfMonth, lt: startOfNext },
    },
    orderBy: { startDate: "asc" },
    include: {
      template: { select: { title: true } },
      orders: {
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              paymentStatus: true,
              status: true,
              totalAmount: true,
              member: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  function isCountable(order: { paymentStatus: string; status: string }): boolean {
    return (
      order.paymentStatus === "PAID" &&
      order.status !== "REFUNDED" &&
      order.status !== "CANCELED"
    );
  }

  const courseStats = courses.map((c) => {
    const validItems = c.orders.filter((i) => isCountable(i.order));
    const studentCount = validItems.reduce((sum, i) => sum + i.quantity, 0);
    const revenue = validItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    return {
      course: c,
      studentCount,
      revenue,
      paidOrders: validItems,
    };
  });

  const totalCourses = courses.length;
  const totalStudents = courseStats.reduce((s, c) => s + c.studentCount, 0);
  const totalRevenue = courseStats.reduce((s, c) => s + c.revenue, 0);

  const rankedCourseStats = courseStats
    .map((c) => ({
      ...c,
      sharePct:
        totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 近 6 個月
  const last6Months: {
    year: number;
    month: number;
    courses: number;
    students: number;
    revenue: number;
  }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(y, m - 1 - i, 1);
    const dtNext = new Date(y, m - i, 1);
    const monthCourses = await prisma.course.findMany({
      where: {
        teacherId: id,
        startDate: { gte: dt, lt: dtNext },
      },
      include: {
        orders: {
          include: {
            order: { select: { paymentStatus: true, status: true } },
          },
        },
      },
    });
    let students = 0;
    let revenue = 0;
    for (const c of monthCourses) {
      for (const item of c.orders) {
        if (isCountable(item.order)) {
          students += item.quantity;
          revenue += item.price * item.quantity;
        }
      }
    }
    last6Months.push({
      year: dt.getFullYear(),
      month: dt.getMonth() + 1,
      courses: monthCourses.length,
      students,
      revenue,
    });
  }

  const maxRevenue = Math.max(...last6Months.map((s) => s.revenue), 1);

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <Link href="/admin/teachers">導師管理</Link>
          <span className="sep">/</span>
          <span className="here">{teacher.name} · 課務統計</span>
        </div>
      </div>

      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {teacher.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={teacher.photo}
              alt={teacher.name}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span
              className="mini-avatar"
              style={{ width: 56, height: 56, fontSize: 22 }}
            >
              {teacher.name.charAt(0)}
            </span>
          )}
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              {teacher.name}
            </h1>
            <div className="muted" style={{ fontSize: 12 }}>
              {teacher.title || "Teacher Stats"}
            </div>
          </div>
        </div>
        <div className="page-actions">
          <Link
            href={`/admin/teachers/${id}/edit`}
            className="btn btn-sm"
          >
            編輯資料
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <span className="caption">選擇月份</span>
        <Suspense>
          <MonthPicker defaultYear={y} defaultMonth={m} />
        </Suspense>
      </div>

      {/* Stat strip — 統一統計 */}
      <div className="stat-strip">
        <div className="stat">
          <div className="stat-label">本月上課</div>
          <div className="stat-value">
            {totalCourses}
            <span className="unit">堂</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">本月學員（已付款）</div>
          <div className="stat-value">
            {totalStudents}
            <span className="unit">人次</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">本月總營收</div>
          <div className="stat-value">
            <span className="unit" style={{ marginLeft: 0, marginRight: 4 }}>NT$</span>
            {totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 近 6 個月走勢 */}
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">近 6 個月走勢</h2>
          <span className="panel-en">TRAILING 6 MONTHS</span>
        </div>
        <div className="panel-body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 8,
            }}
          >
            {last6Months.map((s) => {
              const heightPct =
                maxRevenue > 0
                  ? Math.round((s.revenue / maxRevenue) * 100)
                  : 0;
              const isCurrent = s.year === y && s.month === m;
              return (
                <Link
                  key={`${s.year}-${s.month}`}
                  href={`/admin/teachers/${id}/stats?year=${s.year}&month=${s.month}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      height: 88,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        borderRadius: "4px 4px 0 0",
                        background: isCurrent
                          ? "var(--admin-ink)"
                          : "var(--admin-bg-warm)",
                        transition: "background 0.3s ease",
                        height: `${Math.max(heightPct, s.courses > 0 ? 8 : 2)}%`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: isCurrent
                        ? "var(--admin-text)"
                        : "var(--admin-text-muted)",
                      fontWeight: isCurrent ? 600 : 500,
                    }}
                  >
                    {s.month} 月
                  </div>
                  <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>
                    {s.courses} 堂
                  </div>
                  <div className="tnum muted" style={{ fontSize: 10 }}>
                    NT$ {s.revenue.toLocaleString()}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 本月課程明細 */}
      <section style={{ marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 12,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--admin-font-serif)",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 2,
              margin: 0,
            }}
          >
            {y} 年 {m} 月課程明細
          </h2>
          {totalRevenue > 0 && (
            <div className="muted" style={{ fontSize: 11 }}>
              本月合計{" "}
              <span className="tnum" style={{ color: "var(--admin-text)", fontWeight: 600 }}>
                NT$ {totalRevenue.toLocaleString()}
              </span>
              ，以下按營收大小排序
            </div>
          )}
        </div>

        {courses.length === 0 ? (
          <div
            className="panel"
            style={{ padding: "60px 20px", textAlign: "center" }}
          >
            <p className="muted">這個月沒有排課</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {rankedCourseStats.map(
              ({ course, studentCount, revenue, paidOrders, sharePct }) => (
                <div key={course.id} className="panel" style={{ margin: 0 }}>
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom:
                        paidOrders.length > 0
                          ? "1px solid var(--admin-border)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="link"
                          style={{ fontSize: 14, fontWeight: 600 }}
                        >
                          {course.template.title}
                        </Link>
                        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                          {course.startDate && (
                            <>
                              {new Date(course.startDate).toLocaleDateString("zh-TW")}
                              {course.endDate &&
                                ` ~ ${new Date(course.endDate).toLocaleDateString("zh-TW")}`}
                            </>
                          )}
                          {course.location && ` · ${course.location}`}
                          <span> · 單價 NT$ {course.price.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 24, textAlign: "right" }}>
                        <div>
                          <div className="caption">學員</div>
                          <div className="tnum" style={{ fontSize: 16 }}>
                            {studentCount}
                            <span className="muted" style={{ fontSize: 11, marginLeft: 4 }}>
                              / {course.totalSlots}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="caption">營收</div>
                          <div className="tnum" style={{ fontSize: 16 }}>
                            <span style={{ fontSize: 10, color: "var(--admin-text-muted)", marginRight: 2 }}>
                              NT$
                            </span>
                            {revenue.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ minWidth: 70 }}>
                          <div className="caption">佔比</div>
                          <div className="tnum" style={{ fontSize: 16 }}>
                            {sharePct}
                            <span className="muted" style={{ fontSize: 10, marginLeft: 1 }}>
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {totalRevenue > 0 && (
                      <div className="progress ink" style={{ marginTop: 10 }}>
                        <span style={{ width: `${sharePct}%` }} />
                      </div>
                    )}
                  </div>

                  {paidOrders.length > 0 && (
                    <div>
                      {paidOrders.map((item, i) => (
                        <Link
                          key={item.id}
                          href={`/admin/orders/${item.order.id}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 20px",
                            borderTop:
                              i === 0 ? "none" : "1px solid var(--admin-border)",
                            fontSize: 13,
                            textDecoration: "none",
                            color: "inherit",
                            transition: "background 0.2s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            <span className="tnum muted" style={{ fontSize: 11 }}>
                              {item.order.orderNumber}
                            </span>
                            <span>{item.order.member.name}</span>
                            <span className="muted" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.order.member.email}
                            </span>
                          </div>
                          <span className="tnum" style={{ whiteSpace: "nowrap", marginLeft: 12 }}>
                            <span style={{ fontSize: 10, color: "var(--admin-text-muted)", marginRight: 2 }}>
                              NT$
                            </span>
                            {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </>
  );
}
