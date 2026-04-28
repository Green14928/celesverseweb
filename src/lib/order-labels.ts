export const paymentLabel: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "待付款", cls: "tag-amber" },
  PAID: { text: "已付款", cls: "tag-green" },
  FAILED: { text: "付款失敗", cls: "tag-red" },
  REFUND_PENDING: { text: "退費處理中", cls: "tag-amber" },
  REFUNDED: { text: "已退費", cls: "tag-purple" },
};

export const orderStatusLabel: Record<string, { text: string; cls: string }> = {
  PREPARING: { text: "準備中", cls: "tag-amber" },
  COMPLETED: { text: "已完成", cls: "tag-green" },
  CANCELED: { text: "已取消", cls: "tag-neutral" },
  PENDING: { text: "準備中", cls: "tag-amber" },
  PAID: { text: "準備中", cls: "tag-amber" },
  REFUND_PENDING: { text: "已取消", cls: "tag-neutral" },
  REFUNDED: { text: "已取消", cls: "tag-neutral" },
};

export const paymentText: Record<string, string> = Object.fromEntries(
  Object.entries(paymentLabel).map(([key, value]) => [key, value.text]),
);

export const orderStatusText: Record<string, string> = Object.fromEntries(
  Object.entries(orderStatusLabel).map(([key, value]) => [key, value.text]),
);

export function isCanceledOrder(status: string): boolean {
  return status === "CANCELED" || status === "REFUND_PENDING" || status === "REFUNDED";
}

export function isRefundedPayment(paymentStatus: string): boolean {
  return paymentStatus === "REFUNDED";
}

export function isActivePaidOrder(order: {
  paymentStatus: string;
  status: string;
}): boolean {
  return (
    order.paymentStatus === "PAID" &&
    !isCanceledOrder(order.status)
  );
}
