// 會員中心總覽（入口頁）
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MemberSignOutButton } from "@/features/members/components/MemberSignOutButton";

export default async function AccountPage() {
  const session = await auth();
  if (!session || session.user.userType !== "member") {
    redirect(`/login?callbackUrl=${encodeURIComponent("/account")}`);
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, profileCompletedAt: true },
  });

  if (!member) {
    redirect("/login");
  }

  if (!member.profileCompletedAt) {
    redirect("/complete-profile");
  }

  const entries = [
    {
      href: "/account/profile",
      title: "基本資料",
      desc: "姓名、生日、電話、地址、LINE ID",
    },
    {
      href: "/account/courses",
      title: "我的課程",
      desc: "即將上課與已完成的課程",
    },
    {
      href: "/account/orders",
      title: "過往訂單",
      desc: "歷史購買紀錄與付款狀態",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">會員中心</p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900">
            Hi, {member.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{member.email}</p>
        </div>
        <MemberSignOutButton
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
          >
            <h2 className="text-base font-semibold text-zinc-900 group-hover:text-zinc-700">
              {e.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">{e.desc}</p>
            <span className="mt-4 inline-block text-xs text-zinc-400 group-hover:text-zinc-600">
              進入 →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
