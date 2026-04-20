// 新增管理員頁（僅 SUPER_ADMIN）
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NewAdminForm } from "@/features/admin/components/NewAdminForm";

export default async function NewAdminPage() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    redirect("/admin/login");
  }
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <a href="/admin/admins">管理員</a>
          <span className="sep">/</span>
          <span className="here">新增</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">新增管理員</h1>
          <div className="page-sub">New Admin</div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 640 }}>
        <div className="panel-body">
          <p className="muted" style={{ marginBottom: 20, fontSize: 13 }}>
            填入對方的 Google Email 跟姓名，對方下次用這個 Email 登入 Google
            時就能進入後台。
          </p>
          <NewAdminForm />
        </div>
      </div>
    </>
  );
}
