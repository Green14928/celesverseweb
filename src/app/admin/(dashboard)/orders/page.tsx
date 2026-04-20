// 管理後台 — 訂單列表
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderFilters } from "@/features/admin/components/OrderFilters";
import { Suspense } from "react";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const paymentLabel: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "待付款", cls: "tag-amber" },
  PAID: { text: "已付款", cls: "tag-green" },
  FAILED: { text: "付款失敗", cls: "tag-red" },
};

const statusLabel: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "待付款", cls: "tag-amber" },
  PAID: { text: "已付款", cls: "tag-green" },
  REFUND_PENDING: { text: "退費處理中", cls: "tag-amber" },
  REFUNDED: { text: "已退費", cls: "tag-purple" },
  CANCELED: { text: "已取消", cls: "tag-neutral" },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; year?: string; month?: string }>;
}) {
  const { search, year, month } = await searchParams;

  const where: Prisma.OrderWhereInput = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { member: { name: { contains: search, mode: "insensitive" } } },
      { member: { email: { contains: search, mode: "insensitive" } } },
      { member: { phone: { contains: search } } },
    ];
  }

  if (year && month && !isNaN(Number(year)) && !isNaN(Number(month))) {
    const y = Number(year);
    const m = Number(month);
    if (y > 2000 && m >= 1 && m <= 12) {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      where.createdAt = { gte: start, lt: end };
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      member: { select: { name: true, email: true, phone: true } },
      items: {
        include: {
          course: {
            select: { template: { select: { title: true } } },
          },
        },
      },
      invoices: { select: { id: true, invoiceNumber: true, status: true } },
    },
  });

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>銷售</span>
          <span className="sep">/</span>
          <span className="here">訂單管理</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">訂單管理</h1>
          <div className="page-sub">Orders</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head" style={{ padding: "14px 22px" }}>
          <Suspense>
            <OrderFilters />
          </Suspense>
          <div className="caption">
            共 <span className="serif-num" style={{ fontSize: 14 }}>{orders.length}</span> 筆
            {search && <> · 搜尋「{search}」</>}
            {year && month && (
              <> · {year} 年 {month} 月</>
            )}
          </div>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }} className="muted">
            {search || month ? "沒有符合條件的訂單" : "還沒有任何訂單"}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>訂單編號</th>
                  <th>會員</th>
                  <th>課程</th>
                  <th>金額</th>
                  <th>付款</th>
                  <th>狀態</th>
                  <th>發票</th>
                  <th>時間</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const payment =
                    paymentLabel[order.paymentStatus] ?? paymentLabel.PENDING;
                  const status =
                    statusLabel[order.status] ?? statusLabel.PENDING;
                  const activeInvoice = order.invoices.find(
                    (inv) => inv.status === "ISSUED",
                  );
                  return (
                    <tr key={order.id}>
                      <td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="link"
                          style={{ fontFamily: "var(--admin-font-serif)", fontSize: 12 }}
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className="link">
                          <div style={{ fontWeight: 600 }}>{order.member.name}</div>
                          <div className="caption" style={{ textTransform: "none", letterSpacing: 0 }}>
                            {order.member.email}
                          </div>
                          {order.member.phone && (
                            <div className="caption" style={{ textTransform: "none", letterSpacing: 0 }}>
                              {order.member.phone}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className="link">
                          {order.items
                            .map((item) => item.course.template.title)
                            .join(", ")}
                        </Link>
                      </td>
                      <td className="tnum">
                        <span style={{ fontSize: 10, color: "var(--admin-text-muted)", marginRight: 2 }}>
                          NT$
                        </span>
                        {order.totalAmount.toLocaleString()}
                      </td>
                      <td>
                        <span className={`tag ${payment.cls}`}>{payment.text}</span>
                      </td>
                      <td>
                        <span className={`tag ${status.cls}`}>{status.text}</span>
                      </td>
                      <td>
                        {activeInvoice ? (
                          <span className="tnum" style={{ fontSize: 12 }}>
                            {activeInvoice.invoiceNumber}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {new Date(order.createdAt).toLocaleDateString("zh-TW")}
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
