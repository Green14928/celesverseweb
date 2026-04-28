// 會員中心主頁：我的課程 + 右側資料與訂單摘要
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { orderStatusText, paymentText } from "@/lib/order-labels";
import { MemberSignOutButton } from "@/features/members/components/MemberSignOutButton";

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

function statusTone(status: string): string {
  if (status === "PAID" || status === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (status === "FAILED" || status === "CANCELED") return "bg-red-50 text-red-700";
  if (status === "REFUNDED") return "bg-zinc-100 text-zinc-600";
  return "bg-amber-50 text-amber-700";
}

const invoiceStatusText: Record<string, string> = {
  ISSUED: "已開立",
  VOIDED: "已作廢",
  ALLOWANCE: "已折讓",
};

type CourseRow = {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: Date;
  invoiceStatus: string | null;
  invoiceNumber: string | null;
  courseId: string;
  title: string;
  description: string;
  categoryName: string | null;
  teacherName: string | null;
  imageUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isPostponed: boolean;
  postponedTo: Date | null;
  location: string | null;
};

export default async function AccountPage() {
  const session = await auth();
  if (!session || session.user.userType !== "member") {
    redirect(`/login?callbackUrl=${encodeURIComponent("/account")}`);
  }

  const [member, orders] = await Promise.all([
    prisma.member.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        lineId: true,
        profileCompletedAt: true,
      },
    }),
    prisma.order.findMany({
      where: { memberId: session.user.id },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
        invoices: {
          select: {
            invoiceNumber: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
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
                    description: true,
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
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!member) redirect("/login");
  if (!member.profileCompletedAt) redirect("/complete-profile");

  const rows: CourseRow[] = orders.flatMap((order) =>
    order.items.map((item) => {
      const c = item.course;
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        createdAt: order.createdAt,
        invoiceStatus: order.invoices[0]?.status ?? null,
        invoiceNumber: order.invoices[0]?.invoiceNumber ?? null,
        courseId: c.id,
        title: c.template.title,
        description: c.template.description,
        categoryName: c.template.category?.name ?? null,
        teacherName: c.teacher?.name ?? null,
        imageUrl: c.template.images[0]?.url ?? null,
        startDate: c.startDate,
        endDate: c.endDate,
        isPostponed: c.isPostponed,
        postponedTo: c.postponedTo,
        location: c.location,
      };
    }),
  );

  const now = new Date();
  const upcoming = rows
    .filter((row) => {
      const start = effectiveStart(row);
      return row.paymentStatus === "PAID" && start && start.getTime() > now.getTime();
    })
    .sort((a, b) => {
      const sa = effectiveStart(a)?.getTime() ?? 0;
      const sb = effectiveStart(b)?.getTime() ?? 0;
      return sa - sb;
    });
  const history = rows
    .filter((row) => !upcoming.some((item) => item.orderId === row.orderId && item.courseId === row.courseId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 md:px-8">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">會員中心</p>
          <h1 className="mt-1 text-3xl font-serif font-light text-zinc-900 md:text-5xl">
            Hi, {member.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{member.email}</p>
        </div>
        <MemberSignOutButton className="border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="min-w-0 space-y-12">
          <section className="space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">
                My Courses
              </p>
              <h2 className="mt-1 text-2xl font-medium text-zinc-900">
                我的課程 <span className="text-zinc-400">({upcoming.length})</span>
              </h2>
            </div>

            {upcoming.length === 0 ? (
              <p className="border border-dashed border-zinc-300 bg-white/70 p-10 text-center text-sm text-zinc-400">
                目前沒有即將到來的課程
              </p>
            ) : (
              <div className="space-y-8">
                {upcoming.map((row) => (
                  <FeaturedCourseCard key={`${row.orderId}-${row.courseId}`} row={row} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">
                Records
              </p>
              <h2 className="mt-1 text-xl font-medium text-zinc-900">
                過往紀錄 <span className="text-zinc-400">({history.length})</span>
              </h2>
            </div>

            {history.length === 0 ? (
              <p className="border border-dashed border-zinc-300 bg-white/70 p-8 text-center text-sm text-zinc-400">
                尚無其他訂單紀錄
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {history.map((row) => (
                  <CompactCourseCard key={`${row.orderId}-${row.courseId}`} row={row} />
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <SidebarCard title="基本資料" href="/account/profile">
            <p>{member.email}</p>
            <p>{member.phone ?? "電話尚未填寫"}</p>
            <p>{member.lineId ? `LINE：${member.lineId}` : "LINE 尚未填寫"}</p>
          </SidebarCard>

          <SidebarCard title="過往的課程" href="/account/orders">
            <p>共 {orders.length} 筆紀錄</p>
            <p>已購課程 {rows.length} 筆</p>
            <p>最新紀錄 {orders[0]?.orderNumber ?? "尚無紀錄"}</p>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}

function FeaturedCourseCard({ row }: { row: CourseRow }) {
  const start = effectiveStart(row);
  const payment = paymentText[row.paymentStatus] ?? row.paymentStatus;
  const orderStatus = orderStatusText[row.orderStatus] ?? row.orderStatus;

  return (
    <article className="grid min-h-[70vh] overflow-hidden border border-zinc-200 bg-white shadow-2xl xl:grid-cols-[1.05fr_0.95fr]">
      <Link href={`/experiences/${row.courseId}`} className="relative min-h-[42vh] bg-zinc-100 xl:min-h-full">
        {row.imageUrl ? (
          <Image
            src={row.imageUrl}
            alt={row.title}
            fill
            sizes="(min-width: 1280px) 42vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[42vh] items-center justify-center text-7xl font-serif text-zinc-200">
            {row.title.charAt(0)}
          </div>
        )}
      </Link>
      <div className="flex flex-col justify-between p-6 md:p-10">
        <div>
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.25em] text-zinc-400">
            {row.categoryName && <span>{row.categoryName}</span>}
            {row.teacherName && <span>{row.teacherName}</span>}
          </div>
          <h3 className="mt-4 text-3xl font-serif font-light leading-tight text-zinc-900 md:text-5xl">
            {row.title}
          </h3>
          <p className="mt-5 line-clamp-3 text-sm leading-7 text-zinc-500">
            {row.description}
          </p>
          <div className="mt-8 grid gap-4 border-y border-zinc-100 py-6 sm:grid-cols-2">
            <InfoBlock label="上課日期" value={formatDate(start)} />
            <InfoBlock label="結束日期" value={formatDate(row.endDate)} />
            <InfoBlock label="上課地點" value={row.location ?? "地點待通知"} />
            <InfoBlock label="授課導師" value={row.teacherName ?? "導師待通知"} />
          </div>
          <div className="mt-6 bg-zinc-50 p-5">
            <h4 className="text-sm font-medium text-zinc-900">課前須知</h4>
            <div className="mt-3 grid gap-2 text-sm leading-7 text-zinc-500">
              <p>請依課程通知準時抵達，若課程延期，頁面會顯示最新日期。</p>
              <p>若課程有特殊準備事項，會由 Celesverse 另行通知。</p>
              {row.isPostponed && <p className="text-amber-700">此課程目前已延期，請以最新日期為準。</p>}
            </div>
          </div>
        </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-5">
          <div className="space-y-1 text-xs leading-6 text-zinc-500">
            <p>
              訂單編號{" "}
              <Link href={`/orders/${row.orderId}/success`} className="font-mono text-zinc-900 underline-offset-4 hover:underline">
                {row.orderNumber}
              </Link>
            </p>
            <p>
              發票：{row.invoiceStatus ? invoiceStatusText[row.invoiceStatus] ?? row.invoiceStatus : "尚未開立"}
              {row.invoiceNumber && <span className="font-mono"> · {row.invoiceNumber}</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 text-xs font-medium ${statusTone(row.paymentStatus)}`}>{payment}</span>
            <span className={`px-2.5 py-1 text-xs font-medium ${statusTone(row.orderStatus)}`}>{orderStatus}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function CompactCourseCard({ row }: { row: CourseRow }) {
  const start = effectiveStart(row);
  const payment = paymentText[row.paymentStatus] ?? row.paymentStatus;
  return (
    <article className="grid grid-cols-[88px_1fr] gap-4 border border-zinc-200 bg-white p-4 hover:border-zinc-400 hover:bg-zinc-50">
      <Link href={`/experiences/${row.courseId}`} className="relative h-24 overflow-hidden bg-zinc-100">
        {row.imageUrl ? (
          <Image src={row.imageUrl} alt={row.title} fill sizes="88px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-serif text-zinc-200">{row.title.charAt(0)}</div>
        )}
      </Link>
      <div className="min-w-0">
        <span className={`px-2 py-0.5 text-xs ${statusTone(row.paymentStatus)}`}>{payment}</span>
        <Link href={`/experiences/${row.courseId}`} className="mt-2 block truncate text-base font-medium text-zinc-900 hover:underline">
          {row.title}
        </Link>
        <p className="mt-1 text-xs text-zinc-500">{formatDate(start)}</p>
        <p className="mt-1 text-xs text-zinc-500">
          訂單{" "}
          <Link href={`/orders/${row.orderId}/success`} className="font-mono text-zinc-900 underline-offset-4 hover:underline">
            {row.orderNumber}
          </Link>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          發票：{row.invoiceStatus ? invoiceStatusText[row.invoiceStatus] ?? row.invoiceStatus : "尚未開立"}
          {row.invoiceNumber && <span className="font-mono"> · {row.invoiceNumber}</span>}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-900">NT$ {row.totalAmount.toLocaleString()}</p>
      </div>
    </article>
  );
}

function SidebarCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="block border border-zinc-200 bg-white p-5 hover:border-zinc-400 hover:bg-zinc-50">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-zinc-900">{title}</h2>
        <span className="text-xs text-zinc-400">進入 →</span>
      </div>
      <div className="mt-4 space-y-1 text-xs leading-6 text-zinc-500">{children}</div>
    </Link>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}
