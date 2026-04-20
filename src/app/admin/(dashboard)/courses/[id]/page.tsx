// 課程報名詳情頁
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCourseStatus, courseStatusLabels } from "@/lib/course-status";
import { InlineMoveButton } from "@/features/admin/components/InlineMoveButton";
import { DuplicateCourseButton } from "@/features/admin/components/DuplicateCourseButton";

const paymentTag: Record<string, string> = {
  PENDING: "tag-amber",
  PAID: "tag-green",
  FAILED: "tag-red",
};

const statusTag: Record<string, string> = {
  PENDING: "tag-amber",
  PAID: "tag-green",
  REFUND_PENDING: "tag-amber",
  REFUNDED: "tag-purple",
  CANCELED: "tag-neutral",
};

const paymentText: Record<string, string> = {
  PENDING: "待付款",
  PAID: "已付款",
  FAILED: "付款失敗",
};

const statusText: Record<string, string> = {
  PENDING: "待付款",
  PAID: "已付款",
  REFUND_PENDING: "退費處理中",
  REFUNDED: "已退費",
  CANCELED: "已取消",
};

const courseStatusTag: Record<string, string> = {
  unscheduled: "tag-neutral",
  upcoming: "tag-ink",
  in_progress: "tag-amber",
  completed: "tag-green",
  postponed: "tag-red",
};

export default async function CourseDetailAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      template: { include: { category: true } },
      teacher: true,
    },
  });

  if (!course) notFound();

  const orderItems = await prisma.orderItem.findMany({
    where: { courseId: id },
    include: {
      order: {
        include: {
          member: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
    orderBy: { order: { createdAt: "desc" } },
  });

  const otherCourses = await prisma.course.findMany({
    where: { id: { not: id } },
    select: {
      id: true,
      template: { select: { title: true } },
      totalSlots: true,
      soldCount: true,
      startDate: true,
    },
    orderBy: { startDate: "asc" },
  });

  const otherCoursesData = otherCourses.map((c) => ({
    id: c.id,
    title: c.template.title,
    remaining: c.totalSlots - c.soldCount,
    startDate: c.startDate?.toISOString().split("T")[0] ?? null,
  }));

  const status = getCourseStatus(course);
  const statusInfo = courseStatusLabels[status];
  const remaining = course.totalSlots - course.soldCount;

  const paidCount = orderItems.filter((i) => i.order.paymentStatus === "PAID").length;
  const pendingCount = orderItems.filter((i) => i.order.paymentStatus === "PENDING").length;
  const canceledCount = orderItems.filter((i) => i.order.status === "CANCELED").length;
  const refundedCount = orderItems.filter((i) => i.order.status === "REFUNDED").length;

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <Link href="/admin">首頁</Link>
          <span className="sep">/</span>
          <span className="here">課程詳情</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">{course.template.title}</h1>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            {course.template.category && (
              <span className="tag tag-neutral">
                {course.template.category.name}
              </span>
            )}
            {course.teacher && (
              <span className="tag tag-accent">{course.teacher.name}</span>
            )}
            <span className={`tag ${courseStatusTag[status] ?? "tag-neutral"}`}>
              {statusInfo.text}
            </span>
            <span
              className={`tag ${course.isPublished ? "tag-green" : "tag-neutral"}`}
            >
              {course.isPublished ? "已上架" : "未上架"}
            </span>
          </div>
        </div>
        <div className="page-actions">
          <DuplicateCourseButton
            courseId={id}
            courseName={course.template.title}
          />
          <Link href={`/admin/courses/${id}/edit`} className="btn btn-primary">
            編輯課程
          </Link>
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
          <div className="k">日期</div>
          <div className="v" style={{ fontSize: 15, fontWeight: 600 }}>
            {course.startDate
              ? new Date(course.startDate).toLocaleDateString("zh-TW")
              : "未設定"}
          </div>
          {course.endDate && (
            <div className="hint">
              ~ {new Date(course.endDate).toLocaleDateString("zh-TW")}
            </div>
          )}
          {course.isPostponed && course.postponedTo && (
            <div
              style={{
                color: "var(--admin-red)",
                fontSize: 11,
                marginTop: 4,
              }}
            >
              延期至 {new Date(course.postponedTo).toLocaleDateString("zh-TW")}
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="k">名額</div>
          <div className="v">
            {course.soldCount}
            <span
              style={{
                color: "var(--admin-text-muted)",
                fontSize: 14,
                margin: "0 4px",
              }}
            >
              /
            </span>
            {course.totalSlots}
          </div>
          {remaining <= 0 && (
            <div className="hint" style={{ color: "var(--admin-red)" }}>
              額滿
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="k">已付款</div>
          <div className="v" style={{ color: "var(--admin-green)" }}>
            {paidCount}
            <span className="hint" style={{ marginLeft: 4, fontSize: 12 }}>
              人
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="k">待付款</div>
          <div className="v" style={{ color: "#a67835" }}>
            {pendingCount}
            <span className="hint" style={{ marginLeft: 4, fontSize: 12 }}>
              人
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="k">取消 / 退費</div>
          <div className="v" style={{ fontSize: 22 }}>
            {canceledCount}
            <span
              style={{
                color: "var(--admin-text-muted)",
                fontSize: 14,
                margin: "0 3px",
              }}
            >
              /
            </span>
            {refundedCount}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">報名明細</h2>
            <div className="panel-en">ENROLLMENT</div>
          </div>
          <div className="filter-count">
            共 <span className="num">{orderItems.length}</span> 筆
          </div>
        </div>

        {orderItems.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p className="muted">尚無報名</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>Email</th>
                <th>電話</th>
                <th>金額</th>
                <th style={{ width: 90 }}>付款</th>
                <th style={{ width: 110 }}>狀態</th>
                <th style={{ width: 110 }}>時間</th>
                <th style={{ width: 90 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item) => {
                const pTag = paymentTag[item.order.paymentStatus] ?? "tag-amber";
                const sTag = statusTag[item.order.status] ?? "tag-amber";
                const isCanceled = item.order.status === "CANCELED";
                return (
                  <tr key={item.id}>
                    <td>
                      <Link
                        href={`/admin/members/${item.order.member.id}`}
                        className="link"
                        style={{ fontWeight: 600 }}
                      >
                        {item.order.member.name}
                      </Link>
                    </td>
                    <td className="muted">{item.order.member.email}</td>
                    <td className="muted">{item.order.member.phone || "—"}</td>
                    <td>
                      <span className="price">
                        <span className="cur">NT$</span>
                        {item.price.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={`tag ${pTag}`}>
                        {paymentText[item.order.paymentStatus] ?? "待付款"}
                      </span>
                    </td>
                    <td>
                      <span className={`tag ${sTag}`}>
                        {statusText[item.order.status] ?? "待付款"}
                      </span>
                    </td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      {new Date(item.order.createdAt).toLocaleDateString("zh-TW")}
                    </td>
                    <td>
                      {!isCanceled && (
                        <InlineMoveButton
                          orderItemId={item.id}
                          fromCourseId={id}
                          studentName={item.order.member.name}
                          otherCourses={otherCoursesData}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
