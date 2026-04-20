// 新增排程（從模板建立）
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/features/admin/components/CourseForm";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const [templates, teachers] = await Promise.all([
    prisma.courseTemplate.findMany({
      where: { isArchived: false },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { title: "asc" },
    }),
    prisma.teacher.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const defaultValues = date
    ? {
        templateId: "",
        price: 0,
        teacherId: null,
        totalSlots: 0,
        location: null,
        calendarColor: null,
        paymentLink: null,
        startDate: new Date(date),
        endDate: null,
      }
    : undefined;

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <a href="/admin">首頁</a>
          <span className="sep">/</span>
          <span className="here">新增排程</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">新增排程</h1>
          <div className="page-sub">New Schedule</div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 820 }}>
        <div className="panel-body">
          <p className="muted" style={{ fontSize: 12, marginBottom: 20 }}>
            選擇課程模板，設定排程資訊
          </p>
          <CourseForm
            defaultValues={defaultValues}
            templates={templates}
            teachers={teachers}
          />
        </div>
      </div>
    </>
  );
}
