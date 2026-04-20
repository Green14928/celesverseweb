// 導師列表頁 — Silk & Shadow
import { prisma } from "@/lib/prisma";
import { TeacherCard } from "@/features/teachers/components/TeacherCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guides",
};

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section className="pt-32 md:pt-40 pb-24 mx-6 md:mx-12 lg:mx-16">
      <div className="bg-background shadow-2xl py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6 mb-16 md:mb-24">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
              CELESVERSE Guides
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-light">
            </h1>
            <div className="h-px w-12 bg-gold-dust mx-auto" />
          </div>

          {teachers.length === 0 ? (
            <div className="py-20 text-center text-muted-fg font-sans">
              <p className="text-5xl mb-6 font-serif font-light text-foreground/10">
                ✦
              </p>
              <p className="text-lg font-light">導師資訊即將推出</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
}
