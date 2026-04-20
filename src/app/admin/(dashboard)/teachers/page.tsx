import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteTeacherButton } from "@/features/admin/components/DeleteTeacherButton";

export default async function TeachersAdminPage() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { courses: true } } },
  });

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>內容</span>
          <span className="sep">/</span>
          <span className="here">導師管理</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">導師管理</h1>
          <div className="page-sub">Teachers</div>
        </div>
        <div className="page-actions">
          <Link href="/admin/teachers/new" className="btn btn-primary">
            新增導師
          </Link>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div
          className="panel"
          style={{ padding: "60px 20px", textAlign: "center" }}
        >
          <p className="muted">尚無導師</p>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-body" style={{ padding: 0 }}>
            {teachers.map((teacher, i) => (
              <div
                key={teacher.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 22px",
                  borderTop:
                    i === 0 ? "none" : "1px solid var(--admin-border)",
                }}
              >
                {teacher.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={teacher.photo}
                    alt={teacher.name}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span className="mini-avatar" style={{ width: 40, height: 40, fontSize: 15 }}>
                    {teacher.name.charAt(0)}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{teacher.name}</div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {teacher.title || "未設定頭銜"} · {teacher._count.courses} 門課程
                  </div>
                </div>
                <Link
                  href={`/admin/teachers/${teacher.id}/stats`}
                  className="btn btn-sm"
                >
                  課務統計
                </Link>
                <Link
                  href={`/admin/teachers/${teacher.id}/edit`}
                  className="btn btn-sm"
                >
                  編輯
                </Link>
                <DeleteTeacherButton
                  teacherId={teacher.id}
                  teacherName={teacher.name}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
