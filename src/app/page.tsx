// 首頁 — Hero + Philosophy + 課程 + 導師 + CTA
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/features/courses/components/CourseCard";
import { TeacherCard } from "@/features/teachers/components/TeacherCard";
import { HeroSection } from "@/components/home/HeroSection";
import { PhilosophySection } from "@/components/home/PhilosophySection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [courses, teachers] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        price: true,
        totalSlots: true,
        soldCount: true,
        startDate: true,
        location: true,
        template: {
          include: {
            category: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
          },
        },
      },
    }),
    prisma.teacher.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <>
      <HeroSection />

      <PhilosophySection />

      {/* 課程列表 — 容器化白卡 */}
      <section id="courses" className="mx-6 md:mx-12 lg:mx-16 mt-1 bg-background shadow-2xl py-24 md:py-40 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6 mb-16 md:mb-24">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
              Experiences
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-light">
            </h2>
            <div className="h-px w-12 bg-gold-dust mx-auto" />
          </div>

          {courses.length === 0 ? (
            <div className="py-20 text-center text-muted-fg font-sans">
              <p className="text-5xl mb-6 font-serif font-light text-foreground/10">✦</p>
              <p className="text-lg font-light">目前沒有開放的課程，請稍後再來</p>
            </div>
          ) : (
            <div className="grid gap-x-10 gap-y-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.template.title}
                  description={course.template.description}
                  price={course.price}
                  imageUrl={course.template.images?.[0]?.url ?? null}
                  totalSlots={course.totalSlots}
                  soldCount={course.soldCount}
                  category={course.template.category}
                  startDate={course.startDate}
                  location={course.location}
                  index={index}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              href="/experiences"
              className="inline-block px-12 py-4 border border-border text-foreground text-sm tracking-widest uppercase hover:bg-mist transition-colors duration-500 font-sans"
            >
              所有體驗課程
            </Link>
          </div>
        </div>
      </section>

      {/* 導師區塊 — 容器化白卡 */}
      {teachers.length > 0 && (
        <section id="teachers" className="mx-6 md:mx-12 lg:mx-16 mt-1 bg-background shadow-2xl py-24 md:py-40 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-6 mb-16 md:mb-24">
              <span className="block text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                CELESVERSE Guides
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-light">
              </h2>
              <div className="h-px w-12 bg-gold-dust mx-auto" />
            </div>

            <div className="grid gap-x-10 gap-y-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher, index) => (
                <TeacherCard
                  key={teacher.id}
                  id={teacher.id}
                  name={teacher.name}
                  title={teacher.title}
                  bio={teacher.bio}
                  photo={teacher.photo}
                  index={index}
                />
              ))}
            </div>

            <div className="text-center mt-16">
              <Link
                href="/Guides"
                className="inline-block px-12 py-4 border border-border text-foreground text-sm tracking-widest uppercase hover:bg-mist transition-colors duration-500 font-sans"
              >
                所有靈性嚮導
              </Link>
            </div>
          </div>
        </section>
      )}

    </>
  );
}
