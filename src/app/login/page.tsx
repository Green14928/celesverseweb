// 前台會員登入 / 註冊頁
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MemberSignInButton } from "@/features/members/components/MemberSignInButton";
import { MemberSignOutButton } from "@/features/members/components/MemberSignOutButton";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "此帳號已被停權，請聯絡客服。",
  Configuration: "登入設定有誤，請聯絡客服。",
  Default: "登入失敗，請再試一次。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const callbackUrl = sp.callbackUrl || "/";

  if (session?.user.userType === "member") {
    redirect(callbackUrl);
  }

  const loggedInAsAdmin = session?.user.userType === "admin";
  const errorMessage = sp.error
    ? ERROR_MESSAGES[sp.error] ?? ERROR_MESSAGES.Default
    : null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 pt-24">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900">登入 / 註冊</h1>
          <p className="mt-2 text-sm text-zinc-500">
            第一次登入會自動建立會員，之後補齊基本資料即可購買課程
          </p>
        </div>

        {loggedInAsAdmin && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <p>
              你目前以管理員身分登入。如果要用會員身分買課，請先登出再以會員 Google 帳號登入。
            </p>
            <MemberSignOutButton
              callbackUrl="/login"
              label="登出"
              className="mt-2 text-sm font-semibold text-amber-900 underline"
            />
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <MemberSignInButton callbackUrl={callbackUrl} />

        <p className="text-center text-xs text-zinc-400">
          登入即表示你同意我們的{" "}
          <Link href="/terms" className="underline hover:text-zinc-600">
            服務條款
          </Link>{" "}
          與{" "}
          <Link href="/privacy" className="underline hover:text-zinc-600">
            隱私權政策
          </Link>
        </p>
      </div>
    </div>
  );
}
