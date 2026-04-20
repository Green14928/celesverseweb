// 課程詳情頁 — Silk & Shadow（多圖組圖展示）
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PurchaseForm } from "@/features/orders/components/PurchaseForm";
import { CourseGallery } from "@/features/courses/components/CourseGallery";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id, isPublished: true },
    include: {
      template: {
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
      },
      teacher: true,
    },
  });

  if (!course) notFound();

  const session = await auth();
  const memberLoggedIn = session?.user?.userType === "member";
  const memberEmail = memberLoggedIn ? session!.user.email : null;

  const remaining = course.totalSlots - course.soldCount;
  const isSoldOut = remaining <= 0;

  return (
    <section className="pt-32 md:pt-40 pb-24 mx-6 md:mx-12 lg:mx-16">
      <div className="bg-background shadow-2xl py-12 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* 返回連結 */}
          <Link
            href="/experiences"
            className="inline-flex items-center gap-2 text-sm text-muted-fg hover:text-foreground transition-colors mb-12 font-sans"
          >
            <span className="text-lg leading-none">&larr;</span>
            返回所有體驗課程
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* 左側：圖片組圖 */}
            <div className="lg:col-span-5">
              <CourseGallery
                images={course.template.images.map((img) => img.url)}
                title={course.template.title}
              />
            </div>

            {/* 右側：資訊 */}
            <div className="lg:col-span-7 space-y-10">
              {/* 標題區 */}
              <div className="space-y-4">
                <span className="text-[10px] tracking-[0.3em] uppercase text-gold-dust font-sans">
                  {course.template.category?.name}
                </span>
                <h1 className="text-4xl md:text-5xl font-serif font-light">
                  {course.template.title}
                </h1>
                <p className="text-lg font-light text-muted-fg font-sans">
                  {course.template.description}
                </p>
              </div>

              {/* Meta 資訊 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {course.startDate && (
                  <div className="space-y-2">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                      開課日期
                    </p>
                    <p className="text-sm font-light font-sans">
                      {new Date(course.startDate).toLocaleDateString("zh-TW")}
                    </p>
                  </div>
                )}
                {course.location && (
                  <div className="space-y-2">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                      上課地點
                    </p>
                    <p className="text-sm font-medium font-sans text-foreground">
                      {course.location}
                    </p>
                  </div>
                )}
                {course.endDate && (
                  <div className="space-y-2">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                      結束日期
                    </p>
                    <p className="text-sm font-light font-sans">
                      {new Date(course.endDate).toLocaleDateString("zh-TW")}
                    </p>
                  </div>
                )}
              </div>

              <div className="h-px bg-foreground/15" />

              {/* 課程內容 */}
              {course.template.content && (
                <>
                  <div className="space-y-4">
                    <h2 className="text-2xl font-serif font-light">關於這門課</h2>
                    <p className="text-sm font-light text-muted-fg leading-[1.8] whitespace-pre-wrap font-sans">
                      {course.template.content}
                    </p>
                  </div>
                  <div className="h-px bg-foreground/15" />
                </>
              )}

              {/* 授課導師 */}
              {course.teacher && (
                <>
                  <div className="space-y-4">
                    <h2 className="text-2xl font-serif font-light">授課導師</h2>
                    <div className="flex items-start gap-5">
                      {course.teacher.photo ? (
                        <img
                          src={course.teacher.photo}
                          alt={course.teacher.name}
                          className="w-20 h-20 object-cover mix-blend-multiply opacity-90"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-mist flex items-center justify-center">
                          <span className="text-2xl font-serif font-light text-muted-fg/30">
                            {course.teacher.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <Link
                          href={`/Guides/${course.teacher.id}`}
                          className="text-lg font-serif font-light hover:text-gold-dust transition-colors duration-300"
                        >
                          {course.teacher.name}
                        </Link>
                        {course.teacher.title && (
                          <p className="text-[10px] tracking-[0.3em] uppercase text-gold-dust font-sans">
                            {course.teacher.title}
                          </p>
                        )}
                        {course.teacher.bio && (
                          <p className="text-sm font-light text-muted-fg leading-relaxed font-sans mt-2">
                            {course.teacher.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-foreground/15" />
                </>
              )}

              {/* 價格與購買 */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-12">
                <div className="space-y-1">
                  <span className="text-3xl font-light font-sans">
                    NT$ {course.price.toLocaleString()}
                  </span>
                </div>

                <PurchaseForm
                  courseId={course.id}
                  courseName={course.template.title}
                  price={course.price}
                  memberLoggedIn={memberLoggedIn}
                  memberEmail={memberEmail}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
