// 綠界電子發票 B2C API v3
// 官方文件：https://developers.ecpay.com.tw/?p=7896
// v3 使用 AES-128-CBC 加密 Data 欄位
import crypto from "node:crypto";
import { ecpayInvoice } from "./config";

type CarrierType =
  | "NONE" // 無載具 / 紙本
  | "MEMBER" // 會員載具
  | "MOBILE_BARCODE" // 手機條碼
  | "CITIZEN_CARD" // 自然人憑證
  | "DONATION"; // 捐贈

// 綠界 CarrierType 對應值
// "": 無載具 / "1": 會員載具 / "2": 自然人憑證 / "3": 手機條碼
function mapCarrierType(c: CarrierType): string {
  switch (c) {
    case "MEMBER":
      return "1";
    case "CITIZEN_CARD":
      return "2";
    case "MOBILE_BARCODE":
      return "3";
    default:
      return "";
  }
}

export interface IssueInvoiceInput {
  relateNumber: string; // 我方自訂單號（發票追蹤，對應 Order.orderNumber）
  taxType: "1"; // 1=應稅
  customerName: string;
  customerEmail?: string;
  customerIdentifier?: string; // 統編（三聯式）
  carrierType: CarrierType;
  carrierNum?: string; // 載具號碼（手機條碼要帶 /ABC1234）
  donation?: boolean;
  loveCode?: string; // 捐贈碼
  printFlag: "0" | "1"; // 是否索取紙本（B2C 通常 "0"，B2B 統編必 "1"）
  itemName: string;
  itemCount: number;
  itemUnit?: string;
  itemPrice: number; // 含稅單價
  itemAmount: number; // 含稅小計
  totalAmount: number; // 含稅總金額
  invType: "07" | "08"; // 07=一般稅額 / 08=特種稅額
}

function aes128CbcEncrypt(plain: string, key: string, iv: string): string {
  const cipher = crypto.createCipheriv(
    "aes-128-cbc",
    Buffer.from(key, "utf8"),
    Buffer.from(iv, "utf8"),
  );
  cipher.setAutoPadding(true);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  return encrypted.toString("base64");
}

function aes128CbcDecrypt(cipherText: string, key: string, iv: string): string {
  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    Buffer.from(key, "utf8"),
    Buffer.from(iv, "utf8"),
  );
  decipher.setAutoPadding(true);
  const decrypted = Buffer.concat([
    decipher.update(cipherText, "base64"),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// 綠界 v3 指定：整個 JSON 先 urlencode 再 AES 加密（官方 PHP SDK 做法）
function urlEncodeForEcpay(s: string): string {
  return encodeURIComponent(s)
    .replace(/%20/g, "+")
    .replace(/'/g, "%27")
    .replace(/~/g, "%7E")
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function urlDecodeFromEcpay(s: string): string {
  return decodeURIComponent(s.replace(/\+/g, "%20"));
}

export interface IssueInvoiceResult {
  success: boolean;
  invoiceNumber?: string;
  invoiceDate?: string; // YYYY-MM-DD HH:mm:ss
  raw?: unknown;
  error?: string;
}

export async function issueInvoice(
  input: IssueInvoiceInput,
): Promise<IssueInvoiceResult> {
  const data: Record<string, unknown> = {
    MerchantID: ecpayInvoice.merchantId,
    RelateNumber: input.relateNumber,
    CustomerName: input.customerName,
    CustomerAddr: "",
    CustomerPhone: "",
    CustomerEmail: input.customerEmail ?? "",
    CustomerIdentifier: input.customerIdentifier ?? "",
    Print: input.printFlag,
    Donation: input.donation ? "1" : "0",
    LoveCode: input.loveCode ?? "",
    CarrierType: mapCarrierType(input.carrierType),
    CarrierNum: input.carrierNum ?? "",
    TaxType: input.taxType,
    SalesAmount: input.totalAmount,
    InvoiceRemark: "",
    Items: [
      {
        ItemName: input.itemName,
        ItemCount: input.itemCount,
        ItemWord: input.itemUnit ?? "堂",
        ItemPrice: input.itemPrice,
        ItemTaxType: "1",
        ItemAmount: input.itemAmount,
      },
    ],
    InvType: input.invType,
    vat: "1",
  };

  const bodyJson = JSON.stringify(data);
  const encoded = urlEncodeForEcpay(bodyJson);
  const encryptedData = aes128CbcEncrypt(
    encoded,
    ecpayInvoice.hashKey,
    ecpayInvoice.hashIV,
  );

  const payload = {
    MerchantID: ecpayInvoice.merchantId,
    RqHeader: {
      Timestamp: Math.floor(Date.now() / 1000),
    },
    Data: encryptedData,
  };

  try {
    const res = await fetch(ecpayInvoice.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as { Data?: string; TransCode?: number; TransMsg?: string };

    if (!json.Data) {
      return { success: false, error: json.TransMsg ?? "綠界發票 API 無回應" };
    }

    const decrypted = aes128CbcDecrypt(
      json.Data,
      ecpayInvoice.hashKey,
      ecpayInvoice.hashIV,
    );
    const decoded = urlDecodeFromEcpay(decrypted);
    const resultObj = JSON.parse(decoded) as {
      RtnCode: number;
      RtnMsg: string;
      InvoiceNo?: string;
      InvoiceDate?: string;
    };

    if (resultObj.RtnCode !== 1) {
      return { success: false, error: resultObj.RtnMsg, raw: resultObj };
    }

    return {
      success: true,
      invoiceNumber: resultObj.InvoiceNo,
      invoiceDate: resultObj.InvoiceDate,
      raw: resultObj,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "綠界發票請求失敗",
    };
  }
}

export interface VoidInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  reason: string; // 不可超過 20 字
}

export interface VoidInvoiceResult {
  success: boolean;
  raw?: unknown;
  error?: string;
}

/** 作廢發票（綠界 B2CInvoice/Invalid） */
export async function voidInvoice(
  input: VoidInvoiceInput,
): Promise<VoidInvoiceResult> {
  const data: Record<string, unknown> = {
    MerchantID: ecpayInvoice.merchantId,
    InvoiceNo: input.invoiceNumber,
    InvoiceDate: input.invoiceDate,
    Reason: input.reason.slice(0, 20),
  };

  const bodyJson = JSON.stringify(data);
  const encoded = urlEncodeForEcpay(bodyJson);
  const encryptedData = aes128CbcEncrypt(
    encoded,
    ecpayInvoice.hashKey,
    ecpayInvoice.hashIV,
  );

  const payload = {
    MerchantID: ecpayInvoice.merchantId,
    RqHeader: {
      Timestamp: Math.floor(Date.now() / 1000),
    },
    Data: encryptedData,
  };

  try {
    const res = await fetch(ecpayInvoice.voidEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as {
      Data?: string;
      TransCode?: number;
      TransMsg?: string;
    };

    if (!json.Data) {
      return { success: false, error: json.TransMsg ?? "綠界發票 API 無回應" };
    }

    const decrypted = aes128CbcDecrypt(
      json.Data,
      ecpayInvoice.hashKey,
      ecpayInvoice.hashIV,
    );
    const decoded = urlDecodeFromEcpay(decrypted);
    const resultObj = JSON.parse(decoded) as {
      RtnCode: number;
      RtnMsg: string;
    };

    if (resultObj.RtnCode !== 1) {
      return { success: false, error: resultObj.RtnMsg, raw: resultObj };
    }

    return { success: true, raw: resultObj };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "綠界作廢發票請求失敗",
    };
  }
}
