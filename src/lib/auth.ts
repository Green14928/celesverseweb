// 舊 Admin auth 相容層 — 底層改走 NextAuth v5
// 所有 admin actions 呼叫 getSession() 時，這邊代為查詢 NextAuth session
// 並回傳 adminId（保持舊簽章一致），不再需要自訂 JWT/Cookie
import { auth } from "@/auth";

export async function getSession(): Promise<string | null> {
  const session = await auth();
  if (!session || session.user.userType !== "admin") return null;
  return session.user.id;
}
