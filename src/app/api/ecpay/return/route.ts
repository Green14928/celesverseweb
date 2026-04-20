// 綠界 Server-to-Server 付款通知（ReturnURL）
// 綠界文件要求回應文字 "1|OK"（成功）或 "0|ErrorMsg"（請求重送）
// 本機開發時 ECPay 打不到 localhost，靠 client-return 作為備援
import { handleEcpayPaymentCallback } from "@/lib/ecpay/handlePayment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    params[k] = typeof v === "string" ? v : "";
  }

  try {
    const result = await handleEcpayPaymentCallback(params);
    if (!result.ok) {
      console.error("[ECPay Return] 處理失敗:", result.error);
      return new Response(`0|${result.error ?? "error"}`, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("1|OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (e) {
    console.error("[ECPay Return] 例外:", e);
    return new Response(
      `0|${e instanceof Error ? e.message : "server error"}`,
      { status: 200, headers: { "Content-Type": "text/plain" } },
    );
  }
}
