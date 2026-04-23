// 建立訂單 Server Action（新 schema 版本，會員制 + 綠界金流）
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { buildAioPaymentForm, type EcpayPaymentForm } from "@/lib/ecpay/aio";

// ==========================
// 幸運號碼邏輯（沿用舊版）
// ==========================
const LUCKY_SUFFIXES = [
  "13", "14", "19", "26", "27", "28", "31", "39",
  "41", "49", "62", "68", "72", "78", "82", "86",
  "87", "91", "93", "94",
];
const BANNED_PAIRS = ["18", "81", "79", "97", "42", "24", "36", "63"];

function hasBannedPair(digits: string): boolean {
  for (let i = 0; i < digits.length - 1; i++) {
    const pair = digits[i] + digits[i + 1];
    if (BANNED_PAIRS.includes(pair)) return true;
  }
  return false;
}

function generateLuckyCode(): string {
  const now = new Date();
  const date =
    String(now.getFullYear()) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const dateLastDigit = date.slice(-1);
  const validSuffixes = LUCKY_SUFFIXES.filter((s) => {
    const pair = `${dateLastDigit}${s[0]}`;
    return !BANNED_PAIRS.includes(pair);
  });
  const pool = validSuffixes.length > 0 ? validSuffixes : LUCKY_SUFFIXES;
  const suffix = pool[Math.floor(Math.random() * pool.length)];

  let rand4: string;
  do {
    const digits: string[] = [];
    for (let i = 0; i < 4; i++) digits.push(String(Math.floor(Math.random() * 10)));
    rand4 = digits.join("");
  } while (
    hasBannedPair(rand4) ||
    BANNED_PAIRS.includes(rand4[3] + date[0]) ||
    (rand4.split("0").length - 1) > 1 ||
    (rand4.split("5").length - 1) > 1
  );

  return `${rand4}${date}${suffix}`;
}

// ==========================
// Server Action 輸入型別
// ==========================
export type InvoiceFormInput =
  | {
      invoiceType: "B2C";
      carrierType: "NONE" | "MEMBER" | "MOBILE_BARCODE" | "CITIZEN_CARD";
      carrierCode?: string;
      invoiceEmail: string;
    }
  | {
      invoiceType: "B2B";
      taxId: string; // 統編
      buyerName: string; // 公司抬頭
      invoiceEmail: string;
    }
  | {
      invoiceType: "DONATION";
      loveCode: string; // 捐贈碼
      invoiceEmail?: string;
    };

interface CreateOrderInput {
  courseId: string;
  invoice: InvoiceFormInput;
}

export type CreateOrderResult =
  | { success: true; orderId: string; payment: EcpayPaymentForm }
  | { success: false; error: string };

// ==========================
// 主流程
// ==========================
export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session?.user || session.user.userType !== "member") {
    return { success: false, error: "請先登入會員" };
  }

  const memberId = session.user.id;

  try {
    const { orderId, orderNumber, itemName, totalAmount } =
      await prisma.$transaction(async (tx) => {
        const course = await tx.course.findUnique({
          where: { id: input.courseId, isPublished: true },
          include: { template: { select: { title: true } } },
        });
        if (!course) throw new Error("課程不存在或已下架");

        const remaining = course.totalSlots - course.soldCount;
        if (remaining <= 0) throw new Error("此課程已額滿，無法報名");

        const member = await tx.member.findUnique({ where: { id: memberId } });
        if (!member) throw new Error("會員資料不存在");

        // 產生訂單編號（CV 前綴 + 幸運 14 碼）
        let tryOrderNumber = "";
        for (let i = 0; i < 20; i++) {
          const candidate = `CV${generateLuckyCode()}`;
          const exists = await tx.order.findUnique({
            where: { orderNumber: candidate },
            select: { id: true },
          });
          if (!exists) {
            tryOrderNumber = candidate;
            break;
          }
        }
        if (!tryOrderNumber) throw new Error("訂單編號產生失敗，請稍後再試");

        // 組發票欄位
        let invoiceFields: {
          invoiceType: "B2C" | "B2B";
          invoiceCarrierType:
            | "NONE"
            | "MEMBER"
            | "MOBILE_BARCODE"
            | "CITIZEN_CARD"
            | "DONATION"
            | null;
          invoiceCarrierCode: string | null;
          invoiceBuyerName: string | null;
          invoiceBuyerTaxId: string | null;
          invoiceDonateCode: string | null;
          invoiceEmail: string | null;
        };

        if (input.invoice.invoiceType === "B2B") {
          invoiceFields = {
            invoiceType: "B2B",
            invoiceCarrierType: null,
            invoiceCarrierCode: null,
            invoiceBuyerName: input.invoice.buyerName.trim(),
            invoiceBuyerTaxId: input.invoice.taxId.trim(),
            invoiceDonateCode: null,
            invoiceEmail: input.invoice.invoiceEmail.trim(),
          };
        } else if (input.invoice.invoiceType === "DONATION") {
          invoiceFields = {
            invoiceType: "B2C",
            invoiceCarrierType: "DONATION",
            invoiceCarrierCode: null,
            invoiceBuyerName: null,
            invoiceBuyerTaxId: null,
            invoiceDonateCode: input.invoice.loveCode.trim(),
            invoiceEmail: input.invoice.invoiceEmail?.trim() ?? null,
          };
        } else {
          invoiceFields = {
            invoiceType: "B2C",
            invoiceCarrierType: input.invoice.carrierType,
            invoiceCarrierCode: input.invoice.carrierCode?.trim() || null,
            invoiceBuyerName: null,
            invoiceBuyerTaxId: null,
            invoiceDonateCode: null,
            invoiceEmail: input.invoice.invoiceEmail.trim(),
          };
        }

        // 建立訂單
        const order = await tx.order.create({
          data: {
            orderNumber: tryOrderNumber,
            memberId,
            totalAmount: course.price,
            paymentMethod: "CREDIT_CARD",
            paymentStatus: "PENDING",
            status: "PENDING",
            ecpayMerchantTradeNo: tryOrderNumber,
            ...invoiceFields,
            items: {
              create: {
                courseId: course.id,
                quantity: 1,
                price: course.price,
              },
            },
          },
        });

        // 用單一 SQL 條件更新避免最後名額被同時搶到而超賣
        const reservedRows = await tx.$queryRaw<Array<{ id: string }>>`
          UPDATE "Course"
          SET "soldCount" = "soldCount" + 1
          WHERE "id" = ${input.courseId}
            AND "isPublished" = true
            AND "soldCount" < "totalSlots"
          RETURNING "id"
        `;
        if (reservedRows.length === 0) {
          throw new Error("此課程已額滿，無法報名");
        }

        return {
          orderId: order.id,
          orderNumber: tryOrderNumber,
          itemName: course.template.title,
          totalAmount: course.price,
        };
      });

    // 產生綠界付款表單（交給前端自動送出）
    const payment = buildAioPaymentForm({
      merchantTradeNo: orderNumber,
      itemName,
      totalAmount,
      tradeDesc: `CELESVERSE ${itemName}`,
      choosePayment: "Credit",
      orderId,
    });

    return { success: true, orderId, payment };
  } catch (e) {
    const message = e instanceof Error ? e.message : "下單失敗，請稍後再試";
    return { success: false, error: message };
  }
}
