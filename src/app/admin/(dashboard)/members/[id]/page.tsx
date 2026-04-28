// 管理後台 — 會員詳情 + 訂單歷史
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isActivePaidOrder, orderStatusLabel, paymentLabel } from "@/lib/order-labels";

export const dynamic = "force-dynamic";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              course: { select: { template: { select: { title: true } } } },
            },
          },
        },
      },
    },
  });

  if (!member) notFound();

  const paidOrders = member.orders.filter(isActivePaidOrder);
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <Link href="/admin/members">會員管理</Link>
          <span className="sep">/</span>
          <span className="here">{member.name}</span>
        </div>
      </div>

      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="mini-avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
            {member.name.charAt(0)}
          </span>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              {member.name}
            </h1>
            <div className="muted" style={{ fontSize: 12 }}>
              {member.email}
            </div>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 11, textAlign: "right" }}>
          <div>
            註冊：{new Date(member.createdAt).toLocaleDateString("zh-TW")}
          </div>
          {member.lastLoginAt && (
            <div>
              最後登入：{new Date(member.lastLoginAt).toLocaleString("zh-TW")}
            </div>
          )}
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat">
          <div className="stat-label">訂單總數</div>
          <div className="stat-value">
            {member.orders.length}
            <span className="unit">筆</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">已付款訂單</div>
          <div className="stat-value">
            {paidOrders.length}
            <span className="unit">筆</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">累計消費</div>
          <div className="stat-value">
            <span className="unit" style={{ marginLeft: 0, marginRight: 4 }}>NT$</span>
            {totalSpent.toLocaleString()}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
          gap: 20,
        }}
      >
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">會員資料</h2>
            <span className="panel-en">PROFILE</span>
          </div>
          <div className="panel-body">
            <dl className="dl">
              <dt>姓名</dt>
              <dd>{member.name}</dd>
              <dt>Email</dt>
              <dd>{member.email}</dd>
              {member.phone && (
                <>
                  <dt>電話</dt>
                  <dd>{member.phone}</dd>
                </>
              )}
              {member.gender && (
                <>
                  <dt>性別</dt>
                  <dd>
                    {member.gender === "MALE"
                      ? "男"
                      : member.gender === "FEMALE"
                        ? "女"
                        : "其他"}
                  </dd>
                </>
              )}
              {member.birthday && (
                <>
                  <dt>生日</dt>
                  <dd>
                    {new Date(member.birthday).toLocaleDateString("zh-TW")}
                  </dd>
                </>
              )}
              {member.address && (
                <>
                  <dt>地址</dt>
                  <dd>{member.address}</dd>
                </>
              )}
              {member.lineId && (
                <>
                  <dt>LINE ID</dt>
                  <dd>{member.lineId}</dd>
                </>
              )}
              <dt>狀態</dt>
              <dd>
                {member.isActive ? (
                  <span className="tag tag-green">啟用</span>
                ) : (
                  <span className="tag tag-neutral">停用</span>
                )}
              </dd>
              <dt>資料</dt>
              <dd>
                {member.profileCompletedAt ? (
                  <span className="tag tag-green">已補完</span>
                ) : (
                  <span className="tag tag-amber">未補完</span>
                )}
              </dd>
            </dl>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">訂單歷史</h2>
            <span className="panel-en">ORDER HISTORY</span>
          </div>
          <div className="panel-body">
            {member.orders.length === 0 ? (
              <p className="muted" style={{ textAlign: "center", padding: "40px 0" }}>
                還沒有訂單
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {member.orders.map((order) => {
                  const payment =
                    paymentLabel[order.paymentStatus] ?? paymentLabel.PENDING;
                  const status =
                    orderStatusLabel[order.status] ?? orderStatusLabel.PREPARING;
                  return (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "var(--admin-bg)",
                        borderRadius: 8,
                        padding: "12px 14px",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                            flexWrap: "wrap",
                          }}
                        >
                          <span className="tnum" style={{ fontSize: 12 }}>
                            {order.orderNumber}
                          </span>
                          <span className={`tag ${payment.cls}`}>
                            {payment.text}
                          </span>
                          <span className={`tag ${status.cls}`}>
                            {status.text}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.items
                            .map((item) => item.course.template.title)
                            .join(", ")}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", marginLeft: 12, whiteSpace: "nowrap" }}>
                        <div className="tnum" style={{ fontSize: 14 }}>
                          <span style={{ fontSize: 10, color: "var(--admin-text-muted)", marginRight: 2 }}>
                            NT$
                          </span>
                          {order.totalAmount.toLocaleString()}
                        </div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                          {new Date(order.createdAt).toLocaleDateString("zh-TW")}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
