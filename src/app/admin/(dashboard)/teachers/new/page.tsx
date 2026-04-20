import { TeacherForm } from "@/features/admin/components/TeacherForm";

export default function NewTeacherPage() {
  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <a href="/admin/teachers">導師管理</a>
          <span className="sep">/</span>
          <span className="here">新增</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">新增導師</h1>
          <div className="page-sub">New Teacher</div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 820 }}>
        <div className="panel-body">
          <TeacherForm />
        </div>
      </div>
    </>
  );
}
