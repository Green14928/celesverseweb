// 管理後台 — 訂單列表
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderFilters } from "@/features/admin/components/OrderFilters";
import { Suspense } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { orderStatusLabel, paymentLabel } from "@/lib/order-labels";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    status?: string;
    invoice?: string;
  }>;
}) {
  const { search, startDate, endDate, paymentStatus, status, invoice } =
    await searchParams;

  const where: Prisma.OrderWhereInput = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { member: { name: { contains: search, mode: "insensitive" } } },
      { member: { email: { contains: search, mode: "insensitive" } } },
      { member: { phone: { contains: search } } },
    ];
  }

  if (startDate || endDate) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (startDate) createdAt.gte = new Date(`${startDate}T00:00:00`);
    if (endDate) createdAt.lte = new Date(`${endDate}T23:59:59.999`);
    where.createdAt = createdAt;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus as
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "REFUND_PENDING"
      | "REFUNDED";
  }

  if (status) {
    where.status = status as "PREPARING" | "COMPLETED" | "CANCELED";
  }

  if (invoice === "ISSUED") {
    where.invoices = { some: { status: "ISSUED" } };
  } else if (invoice === "UNISSUED") {
    where.invoices = { none: { status: "ISSUED" } };
  } else if (invoice === "VOIDED") {
    where.invoices = { some: { status: "VOIDED" } };
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
            {(startDate || endDate) && (
              <> · {startDate || "最早"} 至 {endDate || "今天"}</>
            )}
          </div>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }} className="muted">
            {search || startDate || endDate || paymentStatus || status || invoice
              ? "沒有符合條件的訂單"
              : "還沒有任何訂單"}
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
                    orderStatusLabel[order.status] ?? orderStatusLabel.PREPARING;
                  const activeInvoice = order.invoices.find(
                    (inv) => inv.status === "ISSUED",
                  );
                  const href = `/admin/orders/${order.id}`;
                  return (
                    <tr key={order.id} className="clickable-row">
                      <td>
                        <Link
                          href={href}
                          className="row-link"
                          style={{ fontFamily: "var(--admin-font-serif)", fontSize: 12 }}
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <Link href={href} className="row-link">
                          <div style={{ fontWeight: 600 }}>{order.member.name}</div>
                        </Link>
                      </td>
                      <td>
                        <Link href={href} className="row-link">
                          {order.items
                            .map((item) => item.course.template.title)
                            .join(", ")}
                        </Link>
                      </td>
                      <td className="tnum">
                        <Link href={href} className="row-link">
                          <span style={{ fontSize: 10, color: "var(--admin-text-muted)", marginRight: 2 }}>
                            NT$
                          </span>
                          {order.totalAmount.toLocaleString()}
                        </Link>
                      </td>
                      <td>
                        <Link href={href} className="row-link">
                          <span className={`tag ${payment.cls}`}>{payment.text}</span>
                        </Link>
                      </td>
                      <td>
                        <Link href={href} className="row-link">
                          <span className={`tag ${status.cls}`}>{status.text}</span>
                        </Link>
                      </td>
                      <td>
                        <Link href={href} className="row-link">
                          {activeInvoice ? (
                            <span className="tnum" style={{ fontSize: 12 }}>
                              {activeInvoice.invoiceNumber}
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </Link>
                      </td>
                      <td className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        <Link href={href} className="row-link">
                          {new Date(order.createdAt).toLocaleDateString("zh-TW")}
                        </Link>
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
