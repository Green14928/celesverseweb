// 管理後台 — 發票管理
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { InvoiceActions } from "@/features/admin/components/InvoiceActions";
import { Suspense } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { MemberSearch } from "@/features/admin/components/MemberSearch";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  B2C: "二聯式",
  B2B: "三聯式",
};

const statusLabel: Record<string, { text: string; cls: string }> = {
  ISSUED: { text: "已開立", cls: "tag-green" },
  VOIDED: { text: "已作廢", cls: "tag-neutral" },
  ALLOWANCE: { text: "已折讓", cls: "tag-amber" },
};

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const where: Prisma.InvoiceWhereInput = {};
  if (status && status !== "ALL") {
    where.status = status as "ISSUED" | "VOIDED" | "ALLOWANCE";
  }
  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" } },
      { buyerName: { contains: q, mode: "insensitive" } },
      { buyerTaxId: { contains: q } },
      { order: { orderNumber: { contains: q, mode: "insensitive" } } },
      { order: { member: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          member: { select: { name: true, email: true } },
        },
      },
    },
  });

  const counts = await prisma.invoice.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
  const totalCount = counts.reduce((sum, c) => sum + c._count._all, 0);

  const filterLinks = [
    { key: "ALL", label: `全部 ${totalCount}` },
    { key: "ISSUED", label: `已開立 ${countByStatus.get("ISSUED") ?? 0}` },
    { key: "VOIDED", label: `已作廢 ${countByStatus.get("VOIDED") ?? 0}` },
  ];
  const currentStatus = status ?? "ALL";

  function buildQuery(nextStatus: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextStatus !== "ALL") params.set("status", nextStatus);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>銷售</span>
          <span className="sep">/</span>
          <span className="here">發票管理</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">發票管理</h1>
          <div className="page-sub">Invoices</div>
        </div>
      </div>

      <div className="panel">
        <div
          className="panel-head"
          style={{ padding: "14px 22px", gap: 14, flexWrap: "wrap" }}
        >
          <Suspense>
            <MemberSearch />
          </Suspense>
          <div className="filter-pills">
            {filterLinks.map((f) => (
              <Link
                key={f.key}
                href={`/admin/invoices${buildQuery(f.key)}`}
                className={currentStatus === f.key ? "on" : ""}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <div className="caption" style={{ marginLeft: "auto" }}>
            篩選結果 <span className="serif-num" style={{ fontSize: 14 }}>{invoices.length}</span> 張
          </div>
        </div>

        {invoices.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }} className="muted">
            沒有符合條件的發票
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>發票號碼</th>
                  <th>開立日期</th>
                  <th>類型</th>
                  <th>買方</th>
                  <th>訂單</th>
                  <th>金額</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const st = statusLabel[inv.status] ?? statusLabel.ISSUED;
                  return (
                    <tr key={inv.id}>
                      <td className="tnum">{inv.invoiceNumber}</td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>
                        {new Date(inv.invoiceDate).toLocaleDateString("zh-TW")}
                      </td>
                      <td>{typeLabel[inv.type]}</td>
                      <td>
                        <div>{inv.buyerName}</div>
                        {inv.buyerTaxId && (
                          <div className="muted tnum" style={{ fontSize: 11 }}>
                            統編 {inv.buyerTaxId}
                          </div>
                        )}
                        {inv.order.member.email && (
                          <div className="muted" style={{ fontSize: 11 }}>
                            {inv.order.member.email}
                          </div>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/admin/orders/${inv.order.id}`}
                          className="link tnum"
                          style={{ fontSize: 12 }}
                        >
                          {inv.order.orderNumber}
                        </Link>
                      </td>
                      <td className="tnum">
                        <span style={{ fontSize: 10, color: "var(--admin-text-muted)", marginRight: 2 }}>
                          NT$
                        </span>
                        {inv.totalAmount.toLocaleString()}
                      </td>
                      <td>
                        <span className={`tag ${st.cls}`}>{st.text}</span>
                        {inv.status === "VOIDED" && inv.voidReason && (
                          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                            {inv.voidReason}
                          </div>
                        )}
                      </td>
                      <td>
                        {inv.status === "ISSUED" ? (
                          <InvoiceActions
                            invoiceId={inv.id}
                            invoiceNumber={inv.invoiceNumber}
                            invoiceType={inv.type}
                          />
                        ) : (
                          <span className="muted">—</span>
                        )}
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
