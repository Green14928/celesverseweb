// 綠界 CheckMacValue 計算與驗證
// 官方文件：https://developers.ecpay.com.tw/?p=2902
import crypto from "node:crypto";

// 綠界指定 urlencode 規則：大寫、特殊字元保留（跟 .NET HttpUtility.UrlEncode 一致）
function ecpayUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/'/g, "%27")
    .replace(/~/g, "%7E")
    .replace(/%21/g, "!")
    .replace(/%2A/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")");
}

// 依 key 字母順序（不分大小寫）串成 key1=val1&key2=val2
function toSortedQueryString(params: Record<string, string | number>): string {
  const keys = Object.keys(params)
    .filter((k) => k !== "CheckMacValue")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  return keys.map((k) => `${k}=${params[k]}`).join("&");
}

export function generateCheckMacValue(
  params: Record<string, string | number>,
  hashKey: string,
  hashIV: string,
): string {
  const sorted = toSortedQueryString(params);
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = ecpayUrlEncode(raw).toLowerCase();
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

// 驗證綠界回傳的 CheckMacValue
export function verifyCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string,
): boolean {
  const received = params.CheckMacValue;
  if (!received) return false;
  const calculated = generateCheckMacValue(params, hashKey, hashIV);
  return calculated === received;
}
