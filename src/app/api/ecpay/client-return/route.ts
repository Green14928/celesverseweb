// 綠界 OrderResultURL（瀏覽器導回的目的地）
// 收到 POST 後先更新訂單（作為 ReturnURL 的備援），再 302 導到訂單成功頁
import { handleEcpayPaymentCallback } from "@/lib/ecpay/handlePayment";
import { getAppUrl } from "@/lib/ecpay/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    params[k] = typeof v === "string" ? v : "";
  }

  const orderId = params.CustomField1;
  const base = getAppUrl();

  try {
    await handleEcpayPaymentCallback(params);
  } catch (e) {
    console.error("[ECPay Client Return] 處理失敗:", e);
  }

  const target = orderId
    ? `${base}/orders/${orderId}/success`
    : `${base}/orders`;

  return Response.redirect(target, 303);
}
