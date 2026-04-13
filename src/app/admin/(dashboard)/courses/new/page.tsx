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
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">新增排程</h1>
      <p className="mt-1 text-sm text-zinc-400">
        選擇課程模板，設定排程資訊
      </p>
      <div className="mt-6">
        <CourseForm
          defaultValues={defaultValues}
          templates={templates}
          teachers={teachers}
        />
      </div>
    </div>
  );
}
