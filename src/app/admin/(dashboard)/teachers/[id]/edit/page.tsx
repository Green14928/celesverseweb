import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TeacherForm } from "@/features/admin/components/TeacherForm";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) notFound();

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <a href="/admin/teachers">導師管理</a>
          <span className="sep">/</span>
          <span className="here">{teacher.name}</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">編輯導師</h1>
          <div className="page-sub">Edit Teacher</div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 820 }}>
        <div className="panel-body">
          <TeacherForm teacherId={teacher.id} defaultValues={teacher} />
        </div>
      </div>
    </>
  );
}
