"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendRefundCompletedEmail } from "@/lib/email";
import type { OrderStatus } from "@/generated/prisma/enums";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    redirect("/admin/login");
  }
  return session.user.id!;
}

/** 更新退費勾選 — 三個 checkbox 全勾 → refundCompletedAt + paymentStatus=REFUNDED */
export async function updateRefundFlags(
  orderId: string,
  flags: {
    isCanceled: boolean;
    isRefunded: boolean;
    isInvoiceVoided: boolean;
  },
) {
  await requireAdmin();

  const allChecked =
    flags.isCanceled && flags.isRefunded && flags.isInvoiceVoided;
  const anyChecked =
    flags.isCanceled || flags.isRefunded || flags.isInvoiceVoided;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      member: { select: { name: true, email: true } },
      items: {
        include: {
          course: { include: { template: { select: { title: true } } } },
        },
      },
      invoices: {
        where: { status: "VOIDED" },
        orderBy: { voidedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!order) return;

  const emailAlreadySent = order.refundEmailSentAt !== null;
  const isLegacyRefundStatus =
    order.status === "REFUNDED" || order.status === "REFUND_PENDING";
  const shouldRestoreOrderStatus =
    isLegacyRefundStatus ||
    (order.status === "CANCELED" &&
      (order.paymentStatus === "REFUNDED" ||
        order.paymentStatus === "REFUND_PENDING"));

  await prisma.order.update({
    where: { id: orderId },
    data: {
      isCanceled: flags.isCanceled,
      isRefunded: flags.isRefunded,
      isInvoiceVoided: flags.isInvoiceVoided,
      refundCompletedAt: allChecked
        ? (order.refundCompletedAt ?? new Date())
        : null,
      refundRequestedAt: anyChecked
        ? (order.refundRequestedAt ?? new Date())
        : null,
      paymentStatus: allChecked
        ? "REFUNDED"
        : anyChecked
          ? "REFUND_PENDING"
          : order.paymentStatus === "REFUNDED" ||
              order.paymentStatus === "REFUND_PENDING"
            ? order.paidAt
              ? "PAID"
              : "PENDING"
            : order.paymentStatus,
      status: flags.isCanceled
        ? "CANCELED"
        : shouldRestoreOrderStatus
          ? "PREPARING"
          : order.status,
    },
  });

  // 首次 allChecked 且還沒寄過 → 寄退費完成信（refundEmailSentAt 鎖一次性，不會重複寄）
  if (allChecked && !emailAlreadySent) {
    try {
      const voidedInvoice = order.invoices[0];
      await sendRefundCompletedEmail({
        orderId: order.id,
        orderNumber: order.orderNumber,
        buyerName: order.member.name,
        buyerEmail: order.member.email,
        courseName:
          order.items.map((i) => i.course.template.title).join("、") ||
          "CELESVERSE 課程",
        amount: order.totalAmount,
        invoiceVoided: flags.isInvoiceVoided,
        invoiceNumber: voidedInvoice?.invoiceNumber,
        note: order.note ?? undefined,
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { refundEmailSentAt: new Date() },
      });
    } catch (err) {
      console.error("[updateRefundFlags] 退費通知信寄送失敗:", err);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

/** 手動重寄退費通知信（即使已寄過也能再寄） */
export async function resendRefundEmail(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      member: { select: { name: true, email: true } },
      items: {
        include: {
          course: { include: { template: { select: { title: true } } } },
        },
      },
      invoices: {
        where: { status: "VOIDED" },
        orderBy: { voidedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!order) return { success: false, error: "訂單不存在" };
  if (!order.refundCompletedAt) {
    return { success: false, error: "退費流程尚未完成（3 項未全部勾選）" };
  }

  try {
    const voidedInvoice = order.invoices[0];
    await sendRefundCompletedEmail({
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerName: order.member.name,
      buyerEmail: order.member.email,
      courseName:
        order.items.map((i) => i.course.template.title).join("、") ||
        "CELESVERSE 課程",
      amount: order.totalAmount,
      invoiceVoided: order.isInvoiceVoided,
      invoiceNumber: voidedInvoice?.invoiceNumber,
      note: order.note ?? undefined,
    });
    await prisma.order.update({
      where: { id: orderId },
      data: { refundEmailSentAt: new Date() },
    });
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    console.error("[resendRefundEmail] 失敗:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "寄送失敗",
    };
  }
}

/** 更新訂單備註 */
export async function updateOrderNote(orderId: string, note: string) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { note: note.trim() || null },
  });
  revalidatePath(`/admin/orders/${orderId}`);
}

/** 更新訂單處理狀態 */
export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();

  const allowed: OrderStatus[] = ["PREPARING", "COMPLETED", "CANCELED"];
  if (!allowed.includes(status as OrderStatus)) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

/** 取消未付款訂單（直接 CANCELED，釋放庫存） */
export async function cancelPendingOrder(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;
  if (order.paymentStatus === "PAID") return; // 已付款不能用這招取消

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELED", isCanceled: true },
    });
    for (const item of order.items) {
      await tx.course.update({
        where: { id: item.courseId },
        data: { soldCount: { decrement: item.quantity } },
      });
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
