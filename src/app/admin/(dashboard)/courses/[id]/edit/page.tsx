// 編輯排程
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/features/admin/components/CourseForm";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [course, templates, teachers] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
    }),
    prisma.courseTemplate.findMany({
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { title: "asc" },
    }),
    prisma.teacher.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!course) notFound();

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <a href="/admin">首頁</a>
          <span className="sep">/</span>
          <a href={`/admin/courses/${course.id}`}>課程詳情</a>
          <span className="sep">/</span>
          <span className="here">編輯</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">編輯排程</h1>
          <div className="page-sub">Edit Schedule</div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 820 }}>
        <div className="panel-body">
          <CourseForm
            courseId={course.id}
            defaultValues={{
              templateId: course.templateId,
              price: course.price,
              teacherId: course.teacherId,
              totalSlots: course.totalSlots,
              location: course.location,
              calendarColor: course.calendarColor,
              paymentLink: course.paymentLink,
              startDate: course.startDate,
              endDate: course.endDate,
            }}
            templates={templates}
            teachers={teachers}
          />
        </div>
      </div>
    </>
  );
}
