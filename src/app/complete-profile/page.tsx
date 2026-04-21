// 會員補資料頁（第一次登入後使用）
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/features/members/components/ProfileForm";

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();

  if (!session || session.user.userType !== "member") {
    redirect(
      `/login?callbackUrl=${encodeURIComponent("/complete-profile")}`,
    );
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
  });

  if (!member) {
    redirect("/login");
  }

  // 已補完資料就跳走
  if (member.profileCompletedAt) {
    redirect(sp.callbackUrl || "/");
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-28 pb-16">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900">歡迎加入 CELESVERSE ✨</h1>
        <p className="text-sm text-zinc-500">
          請補齊基本資料，以便我們為你保留課程名額與開立發票。
        </p>
      </div>

      <ProfileForm
        mode="complete"
        initial={{
          name: member.name,
          gender: member.gender,
          birthday: member.birthday,
          phone: member.phone,
          address: member.address,
          lineId: member.lineId,
        }}
        successRedirect={sp.callbackUrl || "/"}
      />
    </div>
  );
}
