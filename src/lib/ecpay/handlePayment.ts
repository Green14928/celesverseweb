// 綠界付款回傳共用處理（ReturnURL + OrderResultURL 都走這）
// 冪等設計：重複呼叫不會重複更新狀態 / 重複開發票
import { prisma } from "@/lib/prisma";
import { verifyCheckMacValue } from "./checkmac";
import { ecpayAio } from "./config";
import { issueInvoice } from "./invoice";

export interface PaymentCallbackResult {
  ok: boolean;
  orderId?: string;
  isPaid: boolean;
  error?: string;
}

export async function handleEcpayPaymentCallback(
  params: Record<string, string>,
): Promise<PaymentCallbackResult> {
  if (!verifyCheckMacValue(params, ecpayAio.hashKey, ecpayAio.hashIV)) {
    return { ok: false, isPaid: false, error: "CheckMacValue 驗證失敗" };
  }

  const merchantTradeNo = params.MerchantTradeNo;
  const rtnCode = Number(params.RtnCode);
  const tradeNo = params.TradeNo;
  const isPaid = rtnCode === 1;

  if (!merchantTradeNo) {
    return { ok: false, isPaid: false, error: "缺 MerchantTradeNo" };
  }

  // 找訂單
  const order = await prisma.order.findUnique({
    where: { ecpayMerchantTradeNo: merchantTradeNo },
    include: {
      items: { include: { course: { include: { template: true } } } },
      member: true,
      invoices: true,
    },
  });

  if (!order) {
    return { ok: false, isPaid, error: "訂單不存在" };
  }

  // 已經處理過（冪等）
  if (order.paymentStatus !== "PENDING") {
    return { ok: true, orderId: order.id, isPaid: order.paymentStatus === "PAID" };
  }

  if (!isPaid) {
    // 付款失敗：標記訂單失敗 + 回補庫存
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELED",
          ecpayTradeNo: tradeNo || null,
        },
      });
      for (const item of order.items) {
        await tx.course.update({
          where: { id: item.courseId },
          data: { soldCount: { decrement: item.quantity } },
        });
      }
    });
    return { ok: true, orderId: order.id, isPaid: false };
  }

  // 付款成功：更新訂單狀態
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      status: "PAID",
      paidAt: new Date(),
      ecpayTradeNo: tradeNo,
    },
  });

  // 開立發票（只開一次）
  if (order.invoices.length === 0) {
    const firstItem = order.items[0];
    const itemTitle = firstItem?.course.template.title ?? "CELESVERSE 課程";

    const carrierType: "NONE" | "MEMBER" | "MOBILE_BARCODE" | "CITIZEN_CARD" | "DONATION" =
      (order.invoiceCarrierType as typeof carrierType) ?? "NONE";
    const isDonation = carrierType === "DONATION";

    const customerName =
      order.invoiceType === "B2B" && order.invoiceBuyerName
        ? order.invoiceBuyerName
        : order.member.name;

    const result = await issueInvoice({
      relateNumber: order.orderNumber,
      taxType: "1",
      customerName,
      customerEmail: order.invoiceEmail ?? order.member.email,
      customerIdentifier:
        order.invoiceType === "B2B" ? order.invoiceBuyerTaxId ?? undefined : undefined,
      carrierType: isDonation ? "NONE" : carrierType,
      carrierNum: order.invoiceCarrierCode ?? undefined,
      donation: isDonation,
      loveCode: isDonation ? order.invoiceDonateCode ?? undefined : undefined,
      printFlag: order.invoiceType === "B2B" ? "1" : "0",
      itemName: itemTitle,
      itemCount: 1,
      itemPrice: order.totalAmount,
      itemAmount: order.totalAmount,
      totalAmount: order.totalAmount,
      invType: "07",
    });

    if (result.success && result.invoiceNumber) {
      // 計算稅額（綠界 5% 稅率）
      const taxRate = 0.05;
      const untaxed = Math.round(order.totalAmount / (1 + taxRate));
      const tax = order.totalAmount - untaxed;

      await prisma.invoice.create({
        data: {
          orderId: order.id,
          invoiceNumber: result.invoiceNumber,
          invoiceDate: result.invoiceDate
            ? new Date(result.invoiceDate.replace(" ", "T") + "+08:00")
            : new Date(),
          type: order.invoiceType,
          status: "ISSUED",
          amount: untaxed,
          taxAmount: tax,
          totalAmount: order.totalAmount,
          buyerName: customerName,
          buyerTaxId: order.invoiceBuyerTaxId,
          buyerEmail: order.invoiceEmail,
          carrierType: isDonation ? null : carrierType,
          carrierCode: order.invoiceCarrierCode,
          donateCode: isDonation ? order.invoiceDonateCode : null,
          ecpayResponse: result.raw as object,
        },
      });
    } else {
      // 發票開立失敗不中斷付款流程，記 log；後台可手動重開
      console.error("[ECPay] 發票開立失敗", {
        orderId: order.id,
        error: result.error,
      });
    }
  }

  return { ok: true, orderId: order.id, isPaid: true };
}
