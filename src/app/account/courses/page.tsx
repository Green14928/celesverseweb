// 會員中心 - 我的課程（已付款、非退費）
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function formatDate(d: Date | null): string {
  if (!d) return "日期待定";
  return new Date(d).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function effectiveStart(course: {
  startDate: Date | null;
  isPostponed: boolean;
  postponedTo: Date | null;
}): Date | null {
  if (course.isPostponed && course.postponedTo) return course.postponedTo;
  return course.startDate;
}

type CourseRow = {
  courseId: string;
  title: string;
  categoryName: string | null;
  teacherName: string | null;
  imageUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isPostponed: boolean;
  postponedTo: Date | null;
  location: string | null;
  orderNumber: string;
  paidAt: Date | null;
};

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session || session.user.userType !== "member") {
    redirect(`/login?callbackUrl=${encodeURIComponent("/account/courses")}`);
  }

  const orders = await prisma.order.findMany({
    where: {
      memberId: session.user.id,
      paymentStatus: "PAID",
      status: { notIn: ["REFUNDED", "REFUND_PENDING", "CANCELED"] },
    },
    select: {
      orderNumber: true,
      paidAt: true,
      items: {
        select: {
          course: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              isPostponed: true,
              postponedTo: true,
              location: true,
              template: {
                select: {
                  title: true,
                  category: { select: { name: true } },
                  images: {
                    select: { url: true },
                    orderBy: { sortOrder: "asc" },
                    take: 1,
                  },
                },
              },
              teacher: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  // 攤平 + 去重（同一課程若買多次只留最新一筆）
  const map = new Map<string, CourseRow>();
  for (const order of orders) {
    for (const item of order.items) {
      const c = item.course;
      if (map.has(c.id)) continue;
      map.set(c.id, {
        courseId: c.id,
        title: c.template.title,
        categoryName: c.template.category?.name ?? null,
        teacherName: c.teacher?.name ?? null,
        imageUrl: c.template.images[0]?.url ?? null,
        startDate: c.startDate,
        endDate: c.endDate,
        isPostponed: c.isPostponed,
        postponedTo: c.postponedTo,
        location: c.location,
        orderNumber: order.orderNumber,
        paidAt: order.paidAt,
      });
    }
  }

  const now = new Date();
  const upcoming: CourseRow[] = [];
  const finished: CourseRow[] = [];
  for (const row of map.values()) {
    const start = effectiveStart(row);
    if (start && start.getTime() > now.getTime()) {
      upcoming.push(row);
    } else {
      finished.push(row);
    }
  }

  upcoming.sort((a, b) => {
    const sa = effectiveStart(a)?.getTime() ?? 0;
    const sb = effectiveStart(b)?.getTime() ?? 0;
    return sa - sb;
  });
  finished.sort((a, b) => {
    const sa = effectiveStart(a)?.getTime() ?? 0;
    const sb = effectiveStart(b)?.getTime() ?? 0;
    return sb - sa;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 space-y-10">
      <div>
        <Link
          href="/account"
          className="text-xs text-zinc-500 hover:text-zinc-900"
        >
          ← 返回會員中心
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">我的課程</h1>
        <p className="mt-1 text-sm text-zinc-500">
          共 {map.size} 堂已購買課程（不含已退費）
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          即將上課 <span className="text-zinc-400">({upcoming.length})</span>
        </h2>
        {upcoming.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400">
            目前沒有即將到來的課程
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((c) => (
              <CourseRowCard key={c.courseId} row={c} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          已完成 <span className="text-zinc-400">({finished.length})</span>
        </h2>
        {finished.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400">
            尚無已完成的課程
          </p>
        ) : (
          <div className="space-y-3">
            {finished.map((c) => (
              <CourseRowCard key={c.courseId} row={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CourseRowCard({ row }: { row: CourseRow }) {
  const start = effectiveStart(row);
  return (
    <Link
      href={`/experiences/${row.courseId}`}
      className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
    >
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        {row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.imageUrl}
            alt={row.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-zinc-300">
            {row.title.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {row.categoryName && <span>{row.categoryName}</span>}
          {row.teacherName && (
            <>
              <span>·</span>
              <span>{row.teacherName}</span>
            </>
          )}
        </div>
        <h3 className="mt-1 truncate text-base font-semibold text-zinc-900">
          {row.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>{formatDate(start)}</span>
          {row.isPostponed && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">
              已延期
            </span>
          )}
          {row.location && <span>{row.location}</span>}
        </div>
      </div>
    </Link>
  );
}
