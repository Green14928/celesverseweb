// 導師詳情頁 — Silk & Shadow
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      courses: {
        where: { isPublished: true },
        include: {
          template: { include: { category: true } },
        },
        orderBy: { startDate: "asc" },
      },
    },
  });

  if (!teacher) notFound();

  // 解析完整故事：## 開頭為標題，其餘為段落
  interface BioSection {
    title?: string;
    paragraphs: string[];
  }

  const bioSections: BioSection[] = [];
  if (teacher.fullBio) {
    let currentSection: BioSection = { paragraphs: [] };

    for (const line of teacher.fullBio.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        if (currentSection.title || currentSection.paragraphs.length > 0) {
          bioSections.push(currentSection);
        }
        currentSection = {
          title: trimmed.replace(/^## /, ""),
          paragraphs: [],
        };
      } else if (trimmed === "") {
        // 空行不處理
      } else {
        currentSection.paragraphs.push(trimmed);
      }
    }
    if (currentSection.title || currentSection.paragraphs.length > 0) {
      bioSections.push(currentSection);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero — 容器化白卡 */}
      <section className="pt-32 md:pt-44 mx-6 md:mx-12 lg:mx-16">
        <div className="bg-background shadow-2xl px-6 md:px-12 lg:px-16 py-16 md:py-24">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="animate-float-up">
              <div className="relative overflow-hidden shadow-soft aspect-[3/4] max-w-md mx-auto md:mx-0">
                {teacher.photo ? (
                  <Image
                    src={teacher.photo}
                    alt={teacher.name}
                    fill
                    sizes="(min-width: 768px) 448px, calc(100vw - 48px)"
                    className="w-full h-full object-cover mix-blend-multiply opacity-90"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-mist via-background to-gold-dust/20 flex items-center justify-center">
                    <span className="text-8xl font-serif font-light text-muted-fg/20">
                      {teacher.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="animate-float-up-delay space-y-6">
              <p className="text-[10px] uppercase tracking-[0.3em] font-sans font-light text-muted-fg">
                CELESVERSE 導師
              </p>
              <h1 className="text-5xl md:text-7xl font-serif font-light leading-tight">
                {teacher.name}
              </h1>
              <div className="w-16 h-px bg-gold-dust" />
              {teacher.title && (
                <p className="text-[10px] tracking-[0.3em] uppercase text-gold-dust font-sans">
                  {teacher.title}
                </p>
              )}
              {teacher.bio && (
                <p className="text-lg md:text-xl font-sans font-light leading-relaxed text-muted-fg">
                  {teacher.bio}
                </p>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* 完整故事段落 */}
      {bioSections.map((section, i) => (
        <section
          key={i}
          className="mx-6 md:mx-12 lg:mx-16 mt-1 bg-background shadow-2xl px-6 md:px-12 py-20 md:py-32"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            {section.title && (
              <h2 className="text-3xl md:text-4xl font-serif font-light text-center">
                {section.title.includes("—") ? (
                  <>
                    {section.title.split("—")[0].trim()}
                    <span className="text-gold-dust"> — </span>
                    {section.title.split("—").slice(1).join("—").trim()}
                  </>
                ) : (
                  section.title
                )}
              </h2>
            )}
            <div className="space-y-6 text-base md:text-lg font-sans font-light leading-relaxed text-muted-fg">
              {section.paragraphs.map((p, j) => {
                const isCentered = p.startsWith(">>");
                const text = isCentered ? p.slice(2).trim() : p;
                const parts = text.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={j} className={isCentered ? "text-center" : ""}>
                    {parts.map((part, k) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <span key={k} className="text-foreground font-normal">
                            {part.slice(2, -2)}
                          </span>
                        );
                      }
                      return <span key={k}>{part}</span>;
                    })}
                  </p>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* 導師的話 */}
      {teacher.quote && (
        <section className="mx-6 md:mx-12 lg:mx-16 mt-1 bg-background shadow-2xl px-6 md:px-12 py-20 md:py-32">
          <div className="max-w-3xl mx-auto space-y-12 text-center">
            <div className="max-w-2xl mx-auto">
              <p className="text-[10px] uppercase tracking-[0.3em] font-sans text-gold-dust mb-6">
                來自{teacher.name}的話
              </p>
              <blockquote className="relative bg-mist/50 p-8 md:p-10 text-base md:text-lg font-sans font-light leading-relaxed text-muted-fg border border-border">
                <span className="absolute -top-4 left-8 text-5xl text-gold-dust/40 font-serif">
                  &ldquo;
                </span>
                {teacher.quote}
              </blockquote>
            </div>
          </div>
        </section>
      )}

      {/* 開設課程 */}
      {teacher.courses.length > 0 && (
        <section className="mx-6 md:mx-12 lg:mx-16 mt-1 bg-background shadow-2xl px-6 md:px-12 py-20 md:py-32">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6 mb-12">
              <span className="block text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                Experiences
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-light">
                跟著{teacher.name}一起探索
              </h2>
              <div className="h-px w-12 bg-gold-dust mx-auto" />
            </div>

            <div className="space-y-4">
              {teacher.courses.map((course) => {
                return (
                  <Link
                    key={course.id}
                    href={`/experiences/${course.id}`}
                    className="group block p-6 border border-border bg-background hover:border-gold-dust/50 hover:shadow-soft transition-all duration-500"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          {course.template.category && (
                            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                              {course.template.category.name}
                            </span>
                          )}
                          {course.startDate && (
                            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
                              {new Date(
                                course.startDate
                              ).toLocaleDateString("zh-TW")}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-serif font-light group-hover:text-gold-dust transition-colors duration-500">
                          {course.template.title}
                        </h3>
                        <p className="text-sm font-light text-muted-fg line-clamp-2 font-sans">
                          {course.template.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-lg font-light font-sans">
                          NT$ {course.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 返回導師列表 */}
      <section className="px-6 md:px-12 py-16 text-center">
        <Link
          href="/Guides"
          className="inline-block px-10 py-4 border border-border text-foreground text-sm tracking-[0.2em] uppercase hover:bg-mist transition-colors duration-500 font-sans"
        >
          查看全部導師
        </Link>
      </section>
    </div>
  );
}
