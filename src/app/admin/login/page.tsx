import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInButton } from "@/features/admin/components/SignInButton";
import { SignOutButton } from "@/features/admin/components/SignOutButton";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "此 Google 帳號不在管理員名單內，請聯絡 Amy 授權。",
  Configuration: "登入設定有誤，請聯絡技術支援。",
  Default: "登入失敗，請再試一次。",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  if (session?.user.userType === "admin") {
    redirect(sp.callbackUrl || "/admin");
  }

  const loggedInAsMember = session?.user.userType === "member";
  const errorMessage = sp.error
    ? ERROR_MESSAGES[sp.error] ?? ERROR_MESSAGES.Default
    : null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900">管理後台登入</h1>
          <p className="mt-2 text-sm text-zinc-500">
            使用已授權的 Google 帳號登入
          </p>
        </div>

        {loggedInAsMember && (
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">
              你目前以會員（{session?.user.email}）身分登入，此帳號不是管理員。
            </p>
            <p className="mt-2 text-xs">
              如果你是會員想買課 →{" "}
              <Link href="/" className="font-semibold underline">
                回首頁
              </Link>
              <br />
              如果你要進後台 → 請先登出再以管理員 Google 帳號登入
            </p>
            <div className="mt-3">
              <SignOutButton />
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {!loggedInAsMember && (
          <SignInButton callbackUrl={sp.callbackUrl || "/admin"} />
        )}
      </div>
    </div>
  );
}
