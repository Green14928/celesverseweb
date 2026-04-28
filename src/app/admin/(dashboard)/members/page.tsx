// 管理後台 — 會員列表
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MemberSearch } from "@/features/admin/components/MemberSearch";
import { Suspense } from "react";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Prisma.MemberWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const members = await prisma.member.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  const memberIds = members.map((m) => m.id);
  const paidStats = await prisma.order.groupBy({
    by: ["memberId"],
    where: { memberId: { in: memberIds }, paymentStatus: "PAID" },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });
  const paidByMember = new Map(
    paidStats.map((s) => [
      s.memberId,
      { count: s._count._all, total: s._sum.totalAmount ?? 0 },
    ]),
  );

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>使用者</span>
          <span className="sep">/</span>
          <span className="here">會員管理</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">會員管理</h1>
          <div className="page-sub">Members</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head" style={{ padding: "14px 22px" }}>
          <Suspense>
            <MemberSearch />
          </Suspense>
          <div className="caption">
            共 <span className="serif-num" style={{ fontSize: 14 }}>{members.length}</span> 位
            {q && <> · 搜尋「{q}」</>}
          </div>
        </div>

        {members.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }} className="muted">
            {q ? "沒有符合條件的會員" : "還沒有任何會員"}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>Email</th>
                  <th>電話</th>
                  <th>訂單數</th>
                  <th>已付款消費</th>
                  <th>資料</th>
                  <th>最後登入</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const paid = paidByMember.get(m.id);
                  const href = `/admin/members/${m.id}`;
                  return (
                    <tr key={m.id} className="clickable-row">
                      <td>
                        <Link href={href} className="row-link">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {m.name}
                            {!m.isActive && (
                              <span className="tag tag-neutral">停用</span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="muted">
                        <Link href={href} className="row-link">
                          {m.email}
                        </Link>
                      </td>
                      <td className="muted">
                        <Link href={href} className="row-link">
                          {m.phone ?? "—"}
                        </Link>
                      </td>
                      <td className="tnum">
                        <Link href={href} className="row-link">
                          {m._count.orders}
                        </Link>
                      </td>
                      <td>
                        <Link href={href} className="row-link">
                          {paid ? (
                            <>
                              <span className="muted" style={{ fontSize: 11 }}>
                                ({paid.count} 筆)
                              </span>
                              <span className="tnum" style={{ marginLeft: 6 }}>
                                <span style={{ fontSize: 10, color: "var(--admin-text-muted)", marginRight: 2 }}>
                                  NT$
                                </span>
                                {paid.total.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </Link>
                      </td>
                      <td>
                        <Link href={href} className="row-link">
                          {m.profileCompletedAt ? (
                            <span className="tag tag-green">已補完</span>
                          ) : (
                            <span className="tag tag-amber">未補完</span>
                          )}
                        </Link>
                      </td>
                      <td className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        <Link href={href} className="row-link">
                          {m.lastLoginAt
                            ? new Date(m.lastLoginAt).toLocaleDateString("zh-TW")
                            : "—"}
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
