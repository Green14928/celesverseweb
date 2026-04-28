import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PendingStudentAssignButton } from "@/features/admin/components/PendingStudentAssignButton";

export const dynamic = "force-dynamic";

function fmtDate(date: Date | null | undefined) {
  if (!date) return "日期待定";
  return new Date(date).toLocaleDateString("zh-TW");
}

function daysSince(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export default async function PendingStudentsPage() {
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        paymentStatus: "PAID",
        status: "PREPARING",
      },
    },
    include: {
      order: {
        include: {
          member: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      course: {
        include: {
          template: { select: { title: true, category: { select: { name: true } } } },
          teacher: { select: { name: true } },
        },
      },
    },
    orderBy: { order: { paidAt: "asc" } },
  });

  const availableCourses = await prisma.course.findMany({
    where: {
      totalSlots: { gt: 0 },
    },
    select: {
      id: true,
      startDate: true,
      totalSlots: true,
      soldCount: true,
      isPublished: true,
      template: { select: { title: true } },
    },
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
  });

  const targetCourses = availableCourses
    .map((course) => ({
      id: course.id,
      title: course.template.title,
      startDate: course.startDate?.toISOString() ?? null,
      remaining: course.totalSlots - course.soldCount,
      isPublished: course.isPublished,
    }))
    .filter((course) => course.remaining > 0);

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const uniqueMembers = new Set(orderItems.map((item) => item.order.member.id));
  const oldestDays =
    orderItems.length > 0
      ? Math.max(...orderItems.map((item) => daysSince(item.order.paidAt ?? item.order.createdAt)))
      : 0;

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>內容</span>
          <span className="sep">/</span>
          <span className="here">待安排學員</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">待安排學員</h1>
          <div className="page-sub">Pending Students</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div className="stat-card">
          <div className="k">待安排</div>
          <div className="v">
            {orderItems.length}
            <span className="hint" style={{ marginLeft: 4, fontSize: 12 }}>
              筆
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="k">學員數</div>
          <div className="v">
            {uniqueMembers.size}
            <span className="hint" style={{ marginLeft: 4, fontSize: 12 }}>
              位
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="k">已付款金額</div>
          <div className="v">
            <span style={{ fontSize: 13, marginRight: 4 }}>NT$</span>
            {totalAmount.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="k">最久等待</div>
          <div className="v">
            {oldestDays}
            <span className="hint" style={{ marginLeft: 4, fontSize: 12 }}>
              天
            </span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">未完課名單</h2>
            <div className="panel-en">PAID & PREPARING</div>
          </div>
          <div className="filter-count">
            共 <span className="num">{orderItems.length}</span> 筆
          </div>
        </div>

        {orderItems.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }} className="muted">
            目前沒有待安排學員
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>學員</th>
                  <th>購買課程</th>
                  <th>課程日期</th>
                  <th>導師</th>
                  <th>付款日</th>
                  <th>等待</th>
                  <th>金額</th>
                  <th style={{ width: 360 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => {
                  const paidAt = item.order.paidAt ?? item.order.createdAt;
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/admin/members/${item.order.member.id}`} className="link">
                          <div style={{ fontWeight: 600 }}>{item.order.member.name}</div>
                        </Link>
                        <div className="caption" style={{ textTransform: "none", letterSpacing: 0 }}>
                          {item.order.member.email}
                        </div>
                      </td>
                      <td>
                        <Link href={`/admin/courses/${item.course.id}`} className="link">
                          {item.course.template.title}
                        </Link>
                        {item.course.template.category && (
                          <div style={{ marginTop: 4 }}>
                            <span className="tag tag-neutral">
                              {item.course.template.category.name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>
                        {fmtDate(item.course.startDate)}
                      </td>
                      <td className="muted">{item.course.teacher?.name ?? "未指定"}</td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>
                        {fmtDate(paidAt)}
                      </td>
                      <td>
                        <span className="tag tag-amber">{daysSince(paidAt)} 天</span>
                      </td>
                      <td className="tnum">
                        <span style={{ fontSize: 10, color: "var(--admin-text-muted)", marginRight: 2 }}>
                          NT$
                        </span>
                        {(item.price * item.quantity).toLocaleString()}
                      </td>
                      <td>
                        <div className="ops">
                          <Link href={`/admin/orders/${item.order.id}`} className="op-btn">
                            訂單
                          </Link>
                          <PendingStudentAssignButton
                            orderItemId={item.id}
                            fromCourseId={item.course.id}
                            studentName={item.order.member.name}
                            targetCourses={targetCourses.filter(
                              (course) => course.id !== item.course.id,
                            )}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
