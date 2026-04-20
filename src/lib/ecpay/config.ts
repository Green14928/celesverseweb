// 綠界金流 / 電子發票設定
// stage = 綠界測試環境（不會真的扣卡），production = 正式環境
// 測試金鑰 fallback 到綠界官方公開測試金鑰，方便本機開發

const MODE = process.env.ECPAY_MODE === "production" ? "production" : "stage";

// ==========================
// AIO 全方位金流（信用卡等）
// ==========================
export const ecpayAio = {
  mode: MODE,
  merchantId:
    process.env.ECPAY_MERCHANT_ID ?? (MODE === "stage" ? "3002607" : ""),
  hashKey:
    process.env.ECPAY_HASH_KEY ?? (MODE === "stage" ? "pwFHCqoQZGmho4w6" : ""),
  hashIV:
    process.env.ECPAY_HASH_IV ?? (MODE === "stage" ? "EkRm7iFT261dpevs" : ""),
  endpoint:
    MODE === "production"
      ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
      : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
};

// ==========================
// 電子發票 B2C API v3
// 正式環境：跟 AIO 共用一組（特約賣家後台可見）
// 測試環境：綠界發票 stage 有獨立測試金鑰
// ==========================
export const ecpayInvoice = {
  mode: MODE,
  merchantId:
    process.env.ECPAY_INVOICE_MERCHANT_ID ??
    (MODE === "stage" ? "2000132" : ecpayAio.merchantId),
  hashKey:
    process.env.ECPAY_INVOICE_HASH_KEY ??
    (MODE === "stage" ? "ejCk326UnaZWKisg" : ecpayAio.hashKey),
  hashIV:
    process.env.ECPAY_INVOICE_HASH_IV ??
    (MODE === "stage" ? "q9jcZX8Ib9LM8wYk" : ecpayAio.hashIV),
  endpoint:
    MODE === "production"
      ? "https://einvoice.ecpay.com.tw/B2CInvoice/Issue"
      : "https://einvoice-stage.ecpay.com.tw/B2CInvoice/Issue",
  voidEndpoint:
    MODE === "production"
      ? "https://einvoice.ecpay.com.tw/B2CInvoice/Invalid"
      : "https://einvoice-stage.ecpay.com.tw/B2CInvoice/Invalid",
};

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3001"
  );
}

export function isEcpayStage() {
  return MODE === "stage";
}
