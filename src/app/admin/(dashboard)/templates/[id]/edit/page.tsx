// 編輯課程模板
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CourseTemplateForm } from "@/features/admin/components/CourseTemplateForm";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [template, categories] = await Promise.all([
    prisma.courseTemplate.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!template) notFound();

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <a href="/admin/templates">課程管理</a>
          <span className="sep">/</span>
          <span className="here">{template.title}</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">編輯課程</h1>
          <div className="page-sub">Edit Template</div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 820 }}>
        <div className="panel-body">
          <CourseTemplateForm
            templateId={template.id}
            defaultValues={template}
            existingImages={template.images.map((img) => img.url)}
            categories={categories}
          />
        </div>
      </div>
    </>
  );
}
