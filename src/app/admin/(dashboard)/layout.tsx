// 管理後台 Layout — 含身份驗證和側邊導覽
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/features/admin/components/SignOutButton";
import { SidebarNav } from "@/features/admin/components/SidebarNav";
import "@/app/admin/admin.css";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    redirect("/admin/login");
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const email = session.user.email ?? "";
  const firstChar = (session.user.name ?? email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-icon.png" alt="Celesverse" />
          </div>
          <div className="brand-text">
            <div className="brand-name">celesverse</div>
            <div className="brand-sub">admin · 後台管理</div>
          </div>
        </div>

        <SidebarNav isSuperAdmin={isSuperAdmin} />

        <div className="sidebar-footer">
          <div className="user-row">
            <div className="avatar">{firstChar}</div>
            <div style={{ minWidth: 0 }}>
              <div className="user-name">
                {isSuperAdmin ? "最高管理員" : "管理員"}
              </div>
              <div className="user-email">{email}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
