// 課程詳情頁 — 電商版面：首屏（左封面 + 右資訊/價格/報名）→ 說明 → 內容圖一張張往下 → 導師
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PurchaseForm } from "@/features/orders/components/PurchaseForm";

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

  const allImages = course.template.images.map((img) => img.url);
  const coverImage = allImages[0] ?? null;
  const contentImages = allImages.slice(1);

  return (
    <section className="pt-32 md:pt-40 pb-24 mx-6 md:mx-12 lg:mx-16">
      <div className="bg-background shadow-2xl">
        {/* 返回連結 */}
        <div className="px-6 md:px-12 lg:px-16 pt-8 md:pt-10">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/experiences"
              className="inline-flex items-center gap-2 text-sm text-muted-fg hover:text-foreground transition-colors font-sans"
            >
              <span className="text-lg leading-none">&larr;</span>
              返回所有體驗課程
            </Link>
          </div>
        </div>

        {/* 首屏：左封面 + 右資訊/價格/報名 */}
        <div className="px-6 md:px-12 lg:px-16 pt-6 md:pt-8 pb-12 md:pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
              {/* 左：封面 */}
              <div className="w-full">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={course.template.title}
                    className="w-full h-auto object-cover aspect-[4/3] bg-mist"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-mist" />
                )}
              </div>

              {/* 右：標題 / 導師 / meta / 價格 / 報名 */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-gold-dust font-sans">
                    {course.template.category?.name}
                  </span>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light leading-tight">
                    {course.template.title}
                  </h1>
                  <p className="text-base md:text-lg font-light text-muted-fg font-sans">
                    {course.template.description}
                  </p>
                </div>

                {/* 授課導師（首屏） */}
                {course.teacher && (
                  <Link
                    href={`/Guides/${course.teacher.id}`}
                    className="flex items-center gap-4 p-3 -mx-3 rounded hover:bg-mist/60 transition-colors group"
                  >
                    {course.teacher.photo ? (
                      <img
                        src={course.teacher.photo}
                        alt={course.teacher.name}
                        className="w-14 h-14 object-cover mix-blend-multiply opacity-90 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-mist flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-serif font-light text-muted-fg/30">
                          {course.teacher.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                        授課導師
                      </p>
                      <p className="text-base font-serif font-light group-hover:text-gold-dust transition-colors truncate">
                        {course.teacher.name}
                      </p>
                      {course.teacher.title && (
                        <p className="text-xs text-muted-fg font-sans truncate">
                          {course.teacher.title}
                        </p>
                      )}
                    </div>
                  </Link>
                )}

                <div className="grid grid-cols-2 gap-5">
                  {course.startDate && (
                    <div className="space-y-1">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                        開課日期
                      </p>
                      <p className="text-sm font-light font-sans">
                        {new Date(course.startDate).toLocaleDateString("zh-TW")}
                      </p>
                    </div>
                  )}
                  {course.endDate && (
                    <div className="space-y-1">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                        結束日期
                      </p>
                      <p className="text-sm font-light font-sans">
                        {new Date(course.endDate).toLocaleDateString("zh-TW")}
                      </p>
                    </div>
                  )}
                  {course.location && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                        上課地點
                      </p>
                      <p className="text-sm font-medium font-sans text-foreground">
                        {course.location}
                      </p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-foreground/15" />

                <div className="space-y-4">
                  <span className="block text-3xl md:text-4xl font-light font-sans">
                    NT$ {course.price.toLocaleString()}
                  </span>
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

        {/* 關於這門課 */}
        {course.template.content && (
          <div className="px-6 md:px-12 lg:px-16 pb-10 md:pb-14">
            <div className="max-w-6xl mx-auto">
              <div className="h-px bg-foreground/15 mb-10" />
              <div className="space-y-4 max-w-3xl">
                <h2 className="text-2xl font-serif font-light">關於這門課</h2>
                <p className="text-sm font-light text-muted-fg leading-[1.8] whitespace-pre-wrap font-sans">
                  {course.template.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 內容圖片 — 手機滿版；桌機限寬置中好閱讀 */}
        {contentImages.length > 0 && (
          <div className="w-full bg-mist py-0 md:py-10">
            <div className="w-full md:max-w-[1330px] md:mx-auto">
              {contentImages.map((url, i) => (
                <img
                  key={`${url}-${i}`}
                  src={url}
                  alt={`${course.template.title} 內容圖 ${i + 1}`}
                  className="w-full h-auto block"
                />
              ))}
            </div>
          </div>
        )}

        {/* 底部再放一次「立即報名」，置中 */}
        <div className="px-6 md:px-12 lg:px-16 pt-12 md:pt-16 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="h-px bg-foreground/15 mb-10" />
            <div className="flex justify-center">
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
    </section>
  );
}
