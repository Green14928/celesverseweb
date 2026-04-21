// 會員中心 - 過往訂單
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

function formatDateTime(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "待付款",
  PAID: "已付款",
  REFUND_PENDING: "退費處理中",
  REFUNDED: "已退費",
  CANCELED: "已取消",
};

const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  REFUND_PENDING: "bg-orange-50 text-orange-700",
  REFUNDED: "bg-zinc-100 text-zinc-600",
  CANCELED: "bg-zinc-100 text-zinc-500",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "待付款",
  PAID: "已付款",
  FAILED: "付款失敗",
};

export default async function MyOrdersPage() {
  const session = await auth();
  if (!session || session.user.userType !== "member") {
    redirect(`/login?callbackUrl=${encodeURIComponent("/account/orders")}`);
  }

  const orders = await prisma.order.findMany({
    where: { memberId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      paidAt: true,
      items: {
        select: {
          quantity: true,
          course: {
            select: {
              template: { select: { title: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 space-y-6">
      <div>
        <Link
          href="/account"
          className="text-xs text-zinc-500 hover:text-zinc-900"
        >
          ← 返回會員中心
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">過往訂單</h1>
        <p className="mt-1 text-sm text-zinc-500">
          共 {orders.length} 筆訂單
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400">
          還沒有任何訂單
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-zinc-500">
                    訂單編號 {order.orderNumber}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    成立：{formatDateTime(order.createdAt)}
                  </p>
                  {order.paidAt && (
                    <p className="text-xs text-zinc-400">
                      付款：{formatDateTime(order.paidAt)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_STYLE[order.status]}`}
                  >
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                  {order.paymentStatus !== "PAID" &&
                    order.status !== "CANCELED" &&
                    order.status !== "REFUNDED" && (
                      <span className="text-xs text-zinc-500">
                        {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                      </span>
                    )}
                </div>
              </div>

              <ul className="mt-4 space-y-1 border-t border-zinc-100 pt-3 text-sm text-zinc-700">
                {order.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="truncate">
                      {item.course.template.title}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-zinc-500">
                        x{item.quantity}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                <span className="text-xs text-zinc-500">總金額</span>
                <span className="text-base font-semibold text-zinc-900">
                  NT$ {order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
