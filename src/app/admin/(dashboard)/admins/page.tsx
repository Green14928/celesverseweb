// 管理員管理頁（只有 SUPER_ADMIN 看得到）
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminRow } from "@/features/admin/components/AdminRow";

export default async function AdminsPage() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    redirect("/admin/login");
  }
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const admins = await prisma.admin.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>使用者</span>
          <span className="sep">/</span>
          <span className="here">管理員</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">管理員</h1>
          <div className="page-sub">Admins</div>
        </div>
        <div className="page-actions">
          <Link href="/admin/admins/new" className="btn btn-primary">
            + 新增管理員
          </Link>
        </div>
      </div>

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>Email</th>
              <th style={{ width: 160 }}>角色</th>
              <th style={{ width: 100 }}>狀態</th>
              <th style={{ width: 180 }}>上次登入</th>
              <th style={{ width: 120 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <AdminRow
                key={admin.id}
                admin={{
                  id: admin.id,
                  email: admin.email,
                  name: admin.name,
                  role: admin.role,
                  isActive: admin.isActive,
                  lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
                }}
                isSelf={admin.id === session.user.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="panel"
        style={{
          background: "var(--admin-amber-light)",
          borderColor: "rgba(212, 162, 93, 0.3)",
        }}
      >
        <div className="panel-body">
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            💡 小提醒
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              fontSize: 12,
              color: "var(--admin-text-secondary)",
              lineHeight: 1.9,
            }}
          >
            <li>新增管理員後，對方用自己的 Google 帳號（那個 Email）首次登入即可進入後台</li>
            <li>停用的管理員會被擋在登入頁外，他的歷史紀錄不會被刪除</li>
            <li>SUPER_ADMIN 可以新增 / 停用其他管理員；ADMIN 只能做日常作業</li>
          </ul>
        </div>
      </div>
    </>
  );
}
