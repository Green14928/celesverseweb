// 綠界 AIO 全方位金流：產生付款表單參數
// 官方文件：https://developers.ecpay.com.tw/?p=2862
import { ecpayAio, getAppUrl } from "./config";
import { generateCheckMacValue } from "./checkmac";

export type ChoosePayment = "Credit" | "ApplePay" | "ALL";

interface BuildAioPaymentInput {
  merchantTradeNo: string; // 我方訂單編號（20 字內，英數）
  itemName: string; // 商品名稱
  totalAmount: number; // 總金額（整數新台幣元）
  tradeDesc?: string; // 交易描述
  choosePayment?: ChoosePayment; // 付款方式（預設 Credit）
  orderId: string; // 我方系統的 Order.id（用於 redirect 回來查單）
}

export interface EcpayPaymentForm {
  action: string; // 綠界付款頁 URL
  params: Record<string, string>; // 表單欄位
}

// 綠界的 MerchantTradeDate 格式：yyyy/MM/dd HH:mm:ss
function formatTradeDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function buildAioPaymentForm(input: BuildAioPaymentInput): EcpayPaymentForm {
  const appUrl = getAppUrl();

  const params: Record<string, string> = {
    MerchantID: ecpayAio.merchantId,
    MerchantTradeNo: input.merchantTradeNo,
    MerchantTradeDate: formatTradeDate(new Date()),
    PaymentType: "aio",
    TotalAmount: String(input.totalAmount),
    TradeDesc: encodeURIComponent(input.tradeDesc ?? "CELESVERSE 課程"),
    ItemName: input.itemName.slice(0, 200),
    ReturnURL: `${appUrl}/api/ecpay/return`,
    OrderResultURL: `${appUrl}/api/ecpay/client-return`,
    ClientBackURL: `${appUrl}/orders/${input.orderId}/success`,
    ChoosePayment: input.choosePayment ?? "Credit",
    EncryptType: "1",
    // 信用卡不分期
    CreditInstallment: "0",
    // 追加自訂欄位帶回我方 orderId（綠界會原封不動回傳）
    CustomField1: input.orderId,
  };

  params.CheckMacValue = generateCheckMacValue(
    params,
    ecpayAio.hashKey,
    ecpayAio.hashIV,
  );

  return { action: ecpayAio.endpoint, params };
}
