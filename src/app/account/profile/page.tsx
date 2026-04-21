// 會員中心 - 基本資料
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/features/members/components/ProfileForm";

export default async function AccountProfilePage() {
  const session = await auth();
  if (!session || session.user.userType !== "member") {
    redirect(`/login?callbackUrl=${encodeURIComponent("/account/profile")}`);
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
  });

  if (!member) {
    redirect("/login");
  }

  if (!member.profileCompletedAt) {
    redirect("/complete-profile");
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-28 pb-16 space-y-6">
      <div>
        <Link
          href="/account"
          className="text-xs text-zinc-500 hover:text-zinc-900"
        >
          ← 返回會員中心
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">基本資料</h1>
        <p className="mt-1 text-sm text-zinc-500">{member.email}</p>
      </div>

      <ProfileForm
        mode="edit"
        initial={{
          name: member.name,
          gender: member.gender,
          birthday: member.birthday,
          phone: member.phone,
          address: member.address,
          lineId: member.lineId,
        }}
        successRedirect="/account/profile"
      />
    </div>
  );
}
