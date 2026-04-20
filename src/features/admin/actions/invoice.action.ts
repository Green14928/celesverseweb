"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { issueInvoice, voidInvoice } from "@/lib/ecpay/invoice";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    redirect("/admin/login");
  }
  return session.user.id!;
}

/** 作廢發票（呼叫綠界 + 本地標記） */
export async function voidInvoiceAction(
  invoiceId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  const adminId = await requireAdmin();

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { success: false, error: "發票不存在" };
  if (invoice.status !== "ISSUED") {
    return { success: false, error: `發票狀態為「${invoice.status}」，無法作廢` };
  }

  const trimmed = reason.trim().slice(0, 20);
  if (!trimmed) return { success: false, error: "請輸入作廢原因（20 字內）" };

  const invoiceDateStr = invoice.invoiceDate
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "-");

  const result = await voidInvoice({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoiceDateStr,
    reason: trimmed,
  });

  if (!result.success) {
    return {
      success: false,
      error: `綠界作廢失敗：${result.error ?? "未知錯誤"}`,
    };
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "VOIDED",
      voidedAt: new Date(),
      voidReason: trimmed,
      voidedById: adminId,
    },
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/orders/${invoice.orderId}`);
  return { success: true };
}

/** 重開三聯式發票（作廢原發票 + 開新三聯式） */
export async function reissueAsB2BAction(
  invoiceId: string,
  buyerName: string,
  taxId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  const adminId = await requireAdmin();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { order: { include: { items: { include: { course: { include: { template: true } } } } } } },
  });
  if (!invoice) return { success: false, error: "發票不存在" };
  if (invoice.status !== "ISSUED") {
    return { success: false, error: `發票狀態為「${invoice.status}」，無法重開` };
  }

  const buyerNameTrimmed = buyerName.trim();
  const taxIdTrimmed = taxId.trim();
  if (!buyerNameTrimmed) return { success: false, error: "請填公司抬頭" };
  if (!/^\d{8}$/.test(taxIdTrimmed)) {
    return { success: false, error: "統編格式錯誤（必須 8 位數字）" };
  }

  const reasonTrimmed = reason.trim().slice(0, 20) || "重開三聯式發票";

  // Step 1: 作廢原發票
  const invoiceDateStr = invoice.invoiceDate.toISOString().slice(0, 10);
  const voidResult = await voidInvoice({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoiceDateStr,
    reason: reasonTrimmed,
  });
  if (!voidResult.success) {
    return {
      success: false,
      error: `作廢原發票失敗：${voidResult.error ?? "未知錯誤"}`,
    };
  }

  // Step 2: 開新三聯式
  const order = invoice.order;
  const firstItem = order.items[0];
  const itemTitle = firstItem?.course.template.title ?? "CELESVERSE 課程";

  const issueResult = await issueInvoice({
    relateNumber: `${order.orderNumber}-R${Date.now().toString().slice(-6)}`,
    taxType: "1",
    customerName: buyerNameTrimmed,
    customerEmail: invoice.buyerEmail ?? undefined,
    customerIdentifier: taxIdTrimmed,
    carrierType: "NONE",
    printFlag: "1",
    itemName: itemTitle,
    itemCount: 1,
    itemPrice: invoice.totalAmount,
    itemAmount: invoice.totalAmount,
    totalAmount: invoice.totalAmount,
    invType: "07",
  });

  if (!issueResult.success || !issueResult.invoiceNumber) {
    // 原發票已作廢但新發票沒開成功 → 記下本地作廢狀態 + 回報錯
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "VOIDED",
        voidedAt: new Date(),
        voidReason: reasonTrimmed,
        voidedById: adminId,
      },
    });
    return {
      success: false,
      error: `原發票已作廢，但新三聯式發票開立失敗：${issueResult.error ?? "未知錯誤"}，請聯絡綠界確認`,
    };
  }

  // Step 3: 一起寫入 DB
  const taxRate = 0.05;
  const untaxed = Math.round(invoice.totalAmount / (1 + taxRate));
  const tax = invoice.totalAmount - untaxed;

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "VOIDED",
        voidedAt: new Date(),
        voidReason: reasonTrimmed,
        voidedById: adminId,
      },
    }),
    prisma.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber: issueResult.invoiceNumber,
        invoiceDate: issueResult.invoiceDate
          ? new Date(issueResult.invoiceDate.replace(" ", "T") + "+08:00")
          : new Date(),
        type: "B2B",
        status: "ISSUED",
        amount: untaxed,
        taxAmount: tax,
        totalAmount: invoice.totalAmount,
        buyerName: buyerNameTrimmed,
        buyerTaxId: taxIdTrimmed,
        buyerEmail: invoice.buyerEmail,
        originalInvoiceId: invoice.id,
        ecpayResponse: issueResult.raw as object,
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: {
        invoiceType: "B2B",
        invoiceBuyerName: buyerNameTrimmed,
        invoiceBuyerTaxId: taxIdTrimmed,
      },
    }),
  ]);

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/orders/${order.id}`);
  return { success: true };
}
