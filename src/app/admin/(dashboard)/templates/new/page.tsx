// 新增課程模板
import { prisma } from "@/lib/prisma";
import { CourseTemplateForm } from "@/features/admin/components/CourseTemplateForm";

export default async function NewTemplatePage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <a href="/admin/templates">課程管理</a>
          <span className="sep">/</span>
          <span className="here">新增</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">新增課程</h1>
          <div className="page-sub">New Template</div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 820 }}>
        <div className="panel-body">
          <CourseTemplateForm categories={categories} />
        </div>
      </div>
    </>
  );
}
