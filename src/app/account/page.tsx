// 會員中心（查看/編輯個人資料）
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/features/members/components/ProfileForm";
import { MemberSignOutButton } from "@/features/members/components/MemberSignOutButton";

export default async function AccountPage() {
  const session = await auth();
  if (!session || session.user.userType !== "member") {
    redirect(`/login?callbackUrl=${encodeURIComponent("/account")}`);
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
    <div className="mx-auto max-w-xl px-4 pt-28 pb-16 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">會員中心</h1>
          <p className="mt-1 text-sm text-zinc-500">{member.email}</p>
        </div>
        <MemberSignOutButton
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">基本資料</h2>
          <Link
            href="/account/orders"
            className="text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
          >
            我的訂單 →
          </Link>
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
          successRedirect="/account"
        />
      </section>
    </div>
  );
}
